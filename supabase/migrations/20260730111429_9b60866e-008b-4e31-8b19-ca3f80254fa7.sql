create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when (select count(*) from public.user_roles where role = 'admin') = 0
      then 'admin'::public.app_role
      else 'user'::public.app_role
    end
  )
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_assign_role
after insert on auth.users
for each row execute function public.handle_new_user_role();