-- When someone leaves a project, drop their assignments and pending requests in it
create function public.cleanup_removed_member()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.todo_assignees a
  using public.todos t
  where a.todo_id = t.id and t.project_id = old.project_id and a.user_id = old.user_id;

  delete from public.assignment_requests r
  using public.todos t
  where r.todo_id = t.id and t.project_id = old.project_id
    and r.user_id = old.user_id and r.status = 'pending';

  return old;
end $$;

create trigger project_members_cleanup
  after delete on public.project_members
  for each row execute function public.cleanup_removed_member();
