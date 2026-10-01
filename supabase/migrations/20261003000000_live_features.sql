-- =====================================================================
-- Activity log (per project, written only by triggers)
-- =====================================================================
create table public.activity (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  type       text not null,
  todo_id    uuid references public.todos (id) on delete set null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.activity (project_id, created_at desc);

alter table public.activity enable row level security;
revoke insert, update, delete on public.activity from anon, authenticated;
create policy "members read activity" on public.activity for select to authenticated
  using (public.is_project_member(project_id));

create function public.log_activity(p_project uuid, p_type text, p_todo uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Skip while the project itself is being deleted
  if p_project is null or not exists (select 1 from public.projects where id = p_project) then
    return;
  end if;
  insert into public.activity (project_id, actor_id, type, todo_id, data)
  values (p_project, auth.uid(), p_type, p_todo, coalesce(p_data, '{}'::jsonb));
end $$;
revoke execute on function public.log_activity(uuid, text, uuid, jsonb) from public, anon, authenticated;

-- =====================================================================
-- Notifications (per user, written only by triggers / the deadline RPC)
-- =====================================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in (
               'assigned', 'request_new', 'request_resolved', 'todo_done',
               'note_added', 'added_to_project', 'deadline_soon')),
  actor_id   uuid references public.profiles (id) on delete set null,
  project_id uuid references public.projects (id) on delete cascade,
  todo_id    uuid references public.todos (id) on delete cascade,
  request_id uuid references public.assignment_requests (id) on delete set null,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);
create unique index notifications_one_deadline_per_todo
  on public.notifications (user_id, todo_id) where type = 'deadline_soon';

alter table public.notifications enable row level security;
revoke insert, update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "read own notifications" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Never notifies you about your own actions
create function public.notify(
  p_user uuid, p_type text, p_project uuid, p_todo uuid, p_request uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null or p_user = auth.uid() then
    return;
  end if;
  insert into public.notifications (user_id, type, actor_id, project_id, todo_id, request_id, data)
  values (p_user, p_type, auth.uid(), p_project, p_todo, p_request, coalesce(p_data, '{}'::jsonb));
end $$;
revoke execute on function public.notify(uuid, text, uuid, uuid, uuid, jsonb) from public, anon, authenticated;

-- Called by the app on load: creates "due within 24h / overdue" notifications for your open to-dos, once per to-do
create function public.generate_deadline_notifications()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, project_id, todo_id, data)
  select a.user_id, 'deadline_soon', t.project_id, t.id,
         jsonb_build_object('todo_title', t.title, 'deadline', t.deadline)
  from public.todo_assignees a
  join public.todos t on t.id = a.todo_id
  where a.user_id = auth.uid()
    and t.state <> 'done'
    and t.deadline is not null
    and t.deadline <= now() + interval '24 hours'
  on conflict (user_id, todo_id) where type = 'deadline_soon' do nothing;
end $$;
revoke execute on function public.generate_deadline_notifications() from public, anon;
grant execute on function public.generate_deadline_notifications() to authenticated;

-- =====================================================================
-- Triggers that feed activity + notifications
-- =====================================================================
create function public.profile_name(uid uuid)
returns text language sql stable security definer set search_path = '' as $$
  select full_name from public.profiles where id = uid;
$$;

-- To-dos: created / state / edited / deleted
create function public.on_todo_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.project_id, 'todo_created', new.id,
      jsonb_build_object('todo_title', new.title));

  elsif tg_op = 'UPDATE' then
    if new.state is distinct from old.state then
      perform public.log_activity(new.project_id, 'todo_state', new.id,
        jsonb_build_object('todo_title', new.title, 'from', old.state, 'to', new.state));
      if new.state = 'done' then
        perform public.notify(pm.user_id, 'todo_done', new.project_id, new.id, null,
                              jsonb_build_object('todo_title', new.title))
        from public.project_members pm
        where pm.project_id = new.project_id and pm.role = 'manager';
      end if;
    end if;
    if (new.title, new.description, new.deadline) is distinct from (old.title, old.description, old.deadline) then
      perform public.log_activity(new.project_id, 'todo_edited', new.id,
        jsonb_build_object('todo_title', new.title));
    end if;
    -- A new deadline should be able to warn again
    if new.deadline is distinct from old.deadline then
      delete from public.notifications where todo_id = new.id and type = 'deadline_soon';
    end if;

  elsif tg_op = 'DELETE' then
    perform public.log_activity(old.project_id, 'todo_deleted', null,
      jsonb_build_object('todo_title', old.title));
  end if;
  return coalesce(new, old);
end $$;
create trigger todos_activity
  after insert or update or delete on public.todos
  for each row execute function public.on_todo_changed();

-- Assignees: added / removed
create function public.on_assignee_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t record;
  r record := coalesce(new, old);
begin
  select id, title, project_id, created_by into t from public.todos where id = r.todo_id;
  if t.id is null then
    return r;  -- the to-do itself is being deleted
  end if;

  if tg_op = 'INSERT' then
    -- Approved requests already notify via request_resolved
    if coalesce(current_setting('app.assigned_via_request', true), '') <> 'on' then
      perform public.notify(new.user_id, 'assigned', t.project_id, t.id, null,
        jsonb_build_object('todo_title', t.title));
    end if;
    -- Skip the automatic "creator assigned to own new to-do"
    if not (new.user_id = auth.uid() and t.created_by = new.user_id) then
      perform public.log_activity(t.project_id, 'assigned', t.id,
        jsonb_build_object('todo_title', t.title, 'user_name', public.profile_name(new.user_id)));
    end if;
  else
    perform public.log_activity(t.project_id, 'unassigned', t.id,
      jsonb_build_object('todo_title', t.title, 'user_name', public.profile_name(old.user_id)));
  end if;
  return r;
end $$;
create trigger todo_assignees_activity
  after insert or delete on public.todo_assignees
  for each row execute function public.on_assignee_changed();

-- Assignment requests: new / resolved
create function public.on_request_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t record;
begin
  select id, title, project_id into t from public.todos where id = new.todo_id;

  if tg_op = 'INSERT' then
    perform public.notify(pm.user_id, 'request_new', t.project_id, t.id, new.id,
                          jsonb_build_object('todo_title', t.title, 'message', new.message))
    from public.project_members pm
    where pm.project_id = t.project_id and pm.role = 'manager';
    perform public.log_activity(t.project_id, 'request_new', t.id,
      jsonb_build_object('todo_title', t.title));

  elsif old.status = 'pending' and new.status <> 'pending' then
    perform public.notify(new.user_id, 'request_resolved', t.project_id, t.id, new.id,
      jsonb_build_object('todo_title', t.title, 'approved', new.status = 'approved'));
    perform public.log_activity(t.project_id, 'request_resolved', t.id,
      jsonb_build_object('todo_title', t.title, 'user_name', public.profile_name(new.user_id),
                         'approved', new.status = 'approved'));
  end if;
  return new;
end $$;
create trigger assignment_requests_activity
  after insert or update on public.assignment_requests
  for each row execute function public.on_request_changed();

-- Mark assignments made by approving a request, so they don't double-notify
create or replace function public.resolve_assignment_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'pending' then
    raise exception 'Request already resolved';
  end if;
  new.resolved_by := auth.uid();
  new.resolved_at := now();
  if new.status = 'approved' then
    perform set_config('app.assigned_via_request', 'on', true);
    insert into public.todo_assignees (todo_id, user_id)
    values (new.todo_id, new.user_id)
    on conflict do nothing;
    perform set_config('app.assigned_via_request', 'off', true);
  end if;
  return new;
end $$;

-- Notes: PMs get notified, activity logged
create function public.on_note_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  t record;
begin
  select id, title, project_id into t from public.todos where id = new.todo_id;
  perform public.notify(pm.user_id, 'note_added', t.project_id, t.id, null,
                        jsonb_build_object('todo_title', t.title))
  from public.project_members pm
  where pm.project_id = t.project_id and pm.role = 'manager';
  perform public.log_activity(t.project_id, 'note_added', t.id,
    jsonb_build_object('todo_title', t.title));
  return new;
end $$;
create trigger todo_notes_activity
  after insert on public.todo_notes
  for each row execute function public.on_note_added();

-- Members: added / removed / role changed
create function public.on_member_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  p_name text;
begin
  if tg_op = 'INSERT' then
    -- The creator joining their own new project isn't news
    if new.user_id is distinct from auth.uid() then
      select name into p_name from public.projects where id = new.project_id;
      perform public.notify(new.user_id, 'added_to_project', new.project_id, null, null,
        jsonb_build_object('project_name', p_name));
      perform public.log_activity(new.project_id, 'member_added', null,
        jsonb_build_object('user_name', public.profile_name(new.user_id)));
    end if;
  elsif tg_op = 'DELETE' then
    perform public.log_activity(old.project_id, 'member_removed', null,
      jsonb_build_object('user_name', public.profile_name(old.user_id)));
  elsif new.role is distinct from old.role then
    perform public.log_activity(new.project_id, 'role_changed', null,
      jsonb_build_object('user_name', public.profile_name(new.user_id), 'role', new.role));
  end if;
  return coalesce(new, old);
end $$;
create trigger project_members_activity
  after insert or update or delete on public.project_members
  for each row execute function public.on_member_changed();

-- Project created / status changed
create function public.on_project_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.id, 'project_created', null, '{}'::jsonb);
  elsif new.status is distinct from old.status then
    perform public.log_activity(new.id, 'project_status', null,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;
create trigger projects_activity
  after insert or update on public.projects
  for each row execute function public.on_project_changed();

-- =====================================================================
-- Project files (metadata table + private storage bucket)
-- =====================================================================
create table public.project_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  name         text not null,
  path         text not null unique,
  size         bigint not null default 0,
  content_type text,
  uploaded_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index on public.project_files (project_id, created_at desc);

alter table public.project_files enable row level security;
revoke update on public.project_files from anon, authenticated;
create policy "members read files" on public.project_files for select to authenticated
  using (public.is_project_member(project_id));
create policy "members add files" on public.project_files for insert to authenticated
  with check (public.is_project_member(project_id)
              and uploaded_by = auth.uid()
              and path like project_id::text || '/%');
create policy "uploader or PM deletes files" on public.project_files for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_project_manager(project_id));

create function public.on_file_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.project_id, 'file_uploaded', null, jsonb_build_object('file_name', new.name));
  else
    perform public.log_activity(old.project_id, 'file_deleted', null, jsonb_build_object('file_name', old.name));
  end if;
  return coalesce(new, old);
end $$;
create trigger project_files_activity
  after insert or delete on public.project_files
  for each row execute function public.on_file_changed();

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 26214400)  -- 25 MB
on conflict (id) do nothing;

-- Object paths are "<project_id>/<file>"; returns null for anything else
create function public.storage_project_id(object_name text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return ((storage.foldername(object_name))[1])::uuid;
exception when others then
  return null;
end $$;

create policy "members read project files" on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and public.is_project_member(public.storage_project_id(name)));
create policy "members upload project files" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and public.is_project_member(public.storage_project_id(name)));
create policy "uploader or PM deletes project files" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files'
         and (owner_id = auth.uid()::text or public.is_project_manager(public.storage_project_id(name))));

-- =====================================================================
-- Realtime: stream changes on these tables (RLS still applies)
-- =====================================================================
alter publication supabase_realtime add table
  public.projects,
  public.project_members,
  public.profiles,
  public.todos,
  public.todo_assignees,
  public.todo_notes,
  public.assignment_requests,
  public.notifications,
  public.activity,
  public.project_files;
