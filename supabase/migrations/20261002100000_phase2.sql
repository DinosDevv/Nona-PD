-- Project lifecycle status (dashboard tiles + pills)
create type public.project_status as enum ('planned', 'active', 'on_hold', 'completed');

alter table public.projects
  add column status public.project_status not null default 'active';

-- Optional message when requesting assignment ("I have some time today…")
alter table public.assignment_requests
  add column message text;
