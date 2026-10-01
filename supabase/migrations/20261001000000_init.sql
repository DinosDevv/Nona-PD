-- ============================================================
-- Enums
-- ============================================================
create type public.project_role   as enum ('manager', 'contributor');
create type public.todo_state     as enum ('undone', 'in_progress', 'done');
create type public.request_status as enum ('pending', 'approved', 'rejected');

-- ============================================================
-- Tables
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  user_status text,                               -- global, e.g. "Playing Minecraft"
  created_at  timestamptz not null default now()
);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.project_role not null default 'contributor',
  title      text,                                -- per project, e.g. "Lead Developer"; admin-managed
  joined_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.responsibilities (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null,
  user_id     uuid not null,
  description text not null,
  position    int  not null default 0,
  foreign key (project_id, user_id)
    references public.project_members (project_id, user_id) on delete cascade
);

create table public.todos (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null,
  description text,
  state       public.todo_state not null default 'undone',
  deadline    timestamptz,                        -- null = no deadline
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.todos (project_id);

create table public.todo_assignees (
  todo_id     uuid not null references public.todos (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (todo_id, user_id)
);

create table public.assignment_requests (
  id          uuid primary key default gen_random_uuid(),
  todo_id     uuid not null references public.todos (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status      public.request_status not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
-- at most one open request per user per todo
create unique index assignment_requests_one_pending
  on public.assignment_requests (todo_id, user_id) where status = 'pending';

create table public.todo_notes (
  id         uuid primary key default gen_random_uuid(),
  todo_id    uuid not null references public.todos (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions (security definer so policies don't recurse through RLS)
-- ============================================================
create function public.is_project_member(pid uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members
                 where project_id = pid and user_id = uid);
$$;

create function public.is_project_manager(pid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members
                 where project_id = pid and user_id = auth.uid() and role = 'manager');
$$;

create function public.todo_project(tid uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select project_id from public.todos where id = tid;
$$;

create function public.is_todo_assignee(tid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.todo_assignees
                 where todo_id = tid and user_id = auth.uid());
$$;

-- ============================================================
-- Triggers
-- ============================================================
-- New auth user -> profile row
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Project creator becomes its manager
create function public.add_creator_as_manager()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'manager');
  return new;
end $$;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.add_creator_as_manager();

-- Project creator can never be demoted or removed, so every project keeps a PM.
-- Skipped when the project itself or the creator's profile is being deleted.
create function public.protect_project_creator()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.projects p
             where p.id = old.project_id and p.created_by = old.user_id)
     and exists (select 1 from public.profiles where id = old.user_id)
     and (tg_op = 'DELETE' or new.role <> 'manager') then
    raise exception 'The project creator must remain a project manager';
  end if;
  return coalesce(new, old);
end $$;
create trigger project_members_protect_creator
  before update or delete on public.project_members
  for each row execute function public.protect_project_creator();

-- Todo creator becomes its assignee
create function public.add_creator_as_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.todo_assignees (todo_id, user_id)
  values (new.id, new.created_by);
  return new;
end $$;
create trigger on_todo_created
  after insert on public.todos
  for each row execute function public.add_creator_as_assignee();

-- Title/description: only the author or a PM may change them, and nobody once done
create function public.guard_todo_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.title, new.description) is distinct from (old.title, old.description) then
    if old.state = 'done' then
      raise exception 'Completed to-dos can''t be renamed';
    end if;
    if old.created_by is distinct from auth.uid()
       and not public.is_project_manager(old.project_id) then
      raise exception 'Only the to-do''s author or a PM can rename it';
    end if;
  end if;
  return new;
end $$;
create trigger todos_guard_update
  before update on public.todos
  for each row execute function public.guard_todo_update();

-- PM approves/rejects a request -> stamp it, and assign on approval
create function public.resolve_assignment_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'pending' then
    raise exception 'Request already resolved';
  end if;
  new.resolved_by := auth.uid();
  new.resolved_at := now();
  if new.status = 'approved' then
    insert into public.todo_assignees (todo_id, user_id)
    values (new.todo_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_assignment_request_resolved
  before update on public.assignment_requests
  for each row execute function public.resolve_assignment_request();

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger todos_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();
create trigger todo_notes_updated_at
  before update on public.todo_notes
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.project_members     enable row level security;
alter table public.responsibilities    enable row level security;
alter table public.todos               enable row level security;
alter table public.todo_assignees      enable row level security;
alter table public.assignment_requests enable row level security;
alter table public.todo_notes          enable row level security;

-- Column-level limits: what the app is allowed to change at all
revoke update on public.profiles            from authenticated;
grant  update (full_name, user_status) on public.profiles to authenticated;
revoke insert, update on public.project_members from authenticated;
grant  insert (project_id, user_id, role) on public.project_members to authenticated;
grant  update (role)                      on public.project_members to authenticated;  -- title is admin-only
revoke update on public.todos               from authenticated;
grant  update (title, description, state, deadline) on public.todos to authenticated;
revoke update on public.assignment_requests from authenticated;
grant  update (status) on public.assignment_requests to authenticated;
revoke update on public.todo_notes          from authenticated;
grant  update (body) on public.todo_notes to authenticated;

-- profiles: everyone sees everyone (active-members list); edit only yourself
create policy "read profiles" on public.profiles for select to authenticated
  using (true);
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- projects: members see; anyone creates; managers edit/delete
create policy "read projects" on public.projects for select to authenticated
  using (public.is_project_member(id) or created_by = auth.uid());
create policy "create projects" on public.projects for insert to authenticated
  with check (created_by = auth.uid());
create policy "managers update projects" on public.projects for update to authenticated
  using (public.is_project_manager(id));
create policy "managers delete projects" on public.projects for delete to authenticated
  using (public.is_project_manager(id));

-- project_members: members see roster; managers add/promote/remove
create policy "read members" on public.project_members for select to authenticated
  using (public.is_project_member(project_id));
create policy "managers add members" on public.project_members for insert to authenticated
  with check (public.is_project_manager(project_id));
create policy "managers change roles" on public.project_members for update to authenticated
  using (public.is_project_manager(project_id));
create policy "managers remove members" on public.project_members for delete to authenticated
  using (public.is_project_manager(project_id));

-- responsibilities: read-only from the app (no write policies at all)
create policy "read responsibilities" on public.responsibilities for select to authenticated
  using (public.is_project_member(project_id));

-- todos: members see & create; assignees or managers edit/delete
create policy "read todos" on public.todos for select to authenticated
  using (public.is_project_member(project_id));
create policy "members create todos" on public.todos for insert to authenticated
  with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "assignees or managers update todos" on public.todos for update to authenticated
  using (public.is_todo_assignee(id) or public.is_project_manager(project_id));
create policy "assignees or managers delete todos" on public.todos for delete to authenticated
  using (public.is_todo_assignee(id) or public.is_project_manager(project_id));

-- todo_assignees: only managers assign/unassign (creator + approvals go through triggers)
create policy "read assignees" on public.todo_assignees for select to authenticated
  using (public.is_project_member(public.todo_project(todo_id)));
create policy "managers assign" on public.todo_assignees for insert to authenticated
  with check (public.is_project_manager(public.todo_project(todo_id))
              and public.is_project_member(public.todo_project(todo_id), user_id));
create policy "managers unassign" on public.todo_assignees for delete to authenticated
  using (public.is_project_manager(public.todo_project(todo_id)));

-- assignment_requests: members request for themselves; managers resolve; requester can withdraw
create policy "read requests" on public.assignment_requests for select to authenticated
  using (public.is_project_member(public.todo_project(todo_id)));
create policy "members request assignment" on public.assignment_requests for insert to authenticated
  with check (user_id = auth.uid()
              and status = 'pending'
              and public.is_project_member(public.todo_project(todo_id))
              and not public.is_todo_assignee(todo_id));
create policy "managers resolve requests" on public.assignment_requests for update to authenticated
  using (public.is_project_manager(public.todo_project(todo_id)))
  with check (status in ('approved', 'rejected'));
create policy "withdraw own pending request" on public.assignment_requests for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- todo_notes: members read; assignees write; authors edit/delete their own
create policy "read notes" on public.todo_notes for select to authenticated
  using (public.is_project_member(public.todo_project(todo_id)));
create policy "assignees add notes" on public.todo_notes for insert to authenticated
  with check (user_id = auth.uid() and public.is_todo_assignee(todo_id));
create policy "authors edit notes" on public.todo_notes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "authors delete notes" on public.todo_notes for delete to authenticated
  using (user_id = auth.uid());
