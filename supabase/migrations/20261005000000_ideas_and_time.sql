-- =====================================================================
-- Ideas: notes for future work, convertible into to-dos
-- =====================================================================
create table public.ideas (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  title        text not null,
  description  text,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  todo_id      uuid references public.todos (id) on delete set null,  -- the to-do it became
  converted_at timestamptz,
  created_at   timestamptz not null default now()
);
create index on public.ideas (project_id, created_at desc);

alter table public.ideas enable row level security;
revoke update on public.ideas from anon, authenticated;
grant update (title, description) on public.ideas to authenticated;

create policy "members read ideas" on public.ideas for select to authenticated
  using (public.is_project_member(project_id));
create policy "members add ideas" on public.ideas for insert to authenticated
  with check (public.is_project_member(project_id) and created_by = auth.uid()
              and todo_id is null and converted_at is null);
create policy "author or PM edits ideas" on public.ideas for update to authenticated
  using (created_by = auth.uid() or public.is_project_manager(project_id));
create policy "author or PM deletes ideas" on public.ideas for delete to authenticated
  using (created_by = auth.uid() or public.is_project_manager(project_id));

create function public.on_idea_added()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.log_activity(new.project_id, 'idea_added', null, jsonb_build_object('idea_title', new.title));
  return new;
end $$;
create trigger ideas_activity after insert on public.ideas
  for each row execute function public.on_idea_added();

-- Any member can turn an idea into a to-do: creates it (they're auto-assigned) and marks the idea, in one step
create function public.convert_idea_to_task(p_idea uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  i record;
  new_todo uuid;
begin
  select * into i from public.ideas where id = p_idea for update;
  if i.id is null or not public.is_project_member(i.project_id) then
    raise exception 'Idea not found';
  end if;
  if i.converted_at is not null then
    raise exception 'This idea is already a task';
  end if;

  insert into public.todos (project_id, title, description, created_by)
  values (i.project_id, i.title, i.description, auth.uid())
  returning id into new_todo;

  update public.ideas set todo_id = new_todo, converted_at = now() where id = p_idea;
  perform public.log_activity(i.project_id, 'idea_converted', new_todo,
    jsonb_build_object('idea_title', i.title));
  return new_todo;
end $$;
revoke execute on function public.convert_idea_to_task(uuid) from public, anon;
grant execute on function public.convert_idea_to_task(uuid) to authenticated;

-- =====================================================================
-- Time tracking
-- =====================================================================
create table public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  todo_id    uuid not null references public.todos (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,  -- null while running
  check (ended_at is null or ended_at >= started_at)
);
create index on public.time_entries (todo_id);
-- One running timer per person
create unique index time_entries_one_running on public.time_entries (user_id) where ended_at is null;

alter table public.time_entries enable row level security;
revoke insert, update on public.time_entries from anon, authenticated;
create policy "members read time" on public.time_entries for select to authenticated
  using (public.is_project_member(public.todo_project(todo_id)));
create policy "delete own time entries" on public.time_entries for delete to authenticated
  using (user_id = auth.uid());

-- Starting stops whatever you had running
create function public.start_timer(p_todo uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  t record;
begin
  select id, project_id, state into t from public.todos where id = p_todo;
  if t.id is null then
    raise exception 'To-do not found';
  end if;
  if not (public.is_project_manager(t.project_id) or public.is_todo_assignee(p_todo)) then
    raise exception 'Only assignees or a PM can track time on this to-do';
  end if;
  if t.state = 'done' then
    raise exception 'This to-do is already done';
  end if;

  update public.time_entries set ended_at = now() where user_id = auth.uid() and ended_at is null;
  insert into public.time_entries (todo_id, user_id) values (p_todo, auth.uid());
end $$;

create function public.stop_timer()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.time_entries set ended_at = now() where user_id = auth.uid() and ended_at is null;
end $$;

revoke execute on function public.start_timer(uuid) from public, anon;
revoke execute on function public.stop_timer() from public, anon;
grant execute on function public.start_timer(uuid), public.stop_timer() to authenticated;

-- Marking a to-do done stops every timer on it
create function public.stop_timers_on_done()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.time_entries set ended_at = now() where todo_id = new.id and ended_at is null;
  return new;
end $$;
create trigger todos_stop_timers
  after update of state on public.todos
  for each row when (new.state = 'done' and old.state <> 'done')
  execute function public.stop_timers_on_done();

alter publication supabase_realtime add table public.ideas, public.time_entries;
