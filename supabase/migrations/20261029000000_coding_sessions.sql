-- =====================================================================
-- Coding sessions: time entries belong to a project; the to-do is optional
-- =====================================================================
alter table public.time_entries
  add column project_id uuid references public.projects (id) on delete cascade,
  add column note text,
  add column tags text[] not null default '{}';

update public.time_entries te
set project_id = t.project_id
from public.todos t
where t.id = te.todo_id;

alter table public.time_entries alter column project_id set not null;
alter table public.time_entries alter column todo_id drop not null;

-- Deleting a to-do keeps its logged time (it stays on the project)
alter table public.time_entries drop constraint time_entries_todo_id_fkey;
alter table public.time_entries
  add constraint time_entries_todo_id_fkey
  foreign key (todo_id) references public.todos (id) on delete set null;

create index on public.time_entries (user_id, started_at desc);
create index on public.time_entries (project_id);

-- Readable by project members (no longer needs a to-do)
drop policy "members read time" on public.time_entries;
create policy "members read time" on public.time_entries for select to authenticated
  using (public.is_project_member(project_id));

-- You can describe your own sessions afterwards
grant update (note, tags) on public.time_entries to authenticated;
create policy "describe own sessions" on public.time_entries for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Daily goal for the Today dashboard
alter table public.profiles
  add column daily_goal_minutes int not null default 120
  check (daily_goal_minutes between 0 and 1440);
grant update (daily_goal_minutes) on public.profiles to authenticated;

-- Stops your running session, optionally at an earlier moment (a forgotten timer).
-- Sessions under a minute are discarded. Returns the saved session's id, or null.
drop function public.stop_timer();
create function public.stop_timer(p_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  e record;
  stop_at timestamptz;
begin
  select id, started_at into e from public.time_entries
  where user_id = auth.uid() and ended_at is null;
  if e.id is null then
    return null;
  end if;

  stop_at := least(greatest(coalesce(p_at, now()), e.started_at), now());
  if stop_at - e.started_at < interval '1 minute' then
    delete from public.time_entries where id = e.id;
    return null;
  end if;

  update public.time_entries set ended_at = stop_at where id = e.id;
  return e.id;
end $$;

-- Start a session on a project, optionally on one of its to-dos. Stops whatever you had running.
create function public.start_session(p_project uuid, p_todo uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  t record;
  new_id uuid;
begin
  if not public.is_project_member(p_project) then
    raise exception 'You are not a member of this project';
  end if;
  if p_todo is not null then
    select id, project_id, state into t from public.todos where id = p_todo;
    if t.id is null or t.project_id <> p_project then
      raise exception 'To-do not found in this project';
    end if;
    if not (public.is_project_manager(p_project) or public.is_todo_assignee(p_todo)) then
      raise exception 'Only assignees or a PM can track time on this to-do';
    end if;
    if t.state = 'done' then
      raise exception 'This to-do is already done';
    end if;
  end if;

  perform public.stop_timer();
  insert into public.time_entries (project_id, todo_id, user_id)
  values (p_project, p_todo, auth.uid())
  returning id into new_id;
  return new_id;
end $$;

-- Kept so the currently deployed app version keeps working until the next push
create or replace function public.start_timer(p_todo uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.start_session((select project_id from public.todos where id = p_todo), p_todo);
end $$;

revoke execute on function public.stop_timer(timestamptz) from public, anon;
revoke execute on function public.start_session(uuid, uuid) from public, anon;
grant execute on function public.stop_timer(timestamptz), public.start_session(uuid, uuid) to authenticated;
