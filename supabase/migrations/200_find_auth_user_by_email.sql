-- O(1) auth user lookup by email for signup / password-reset (no listUsers scan).
-- Callable only via service_role (RLS-style grants).

create or replace function public.find_auth_user_by_email(p_email text)
returns table (id uuid, email_confirmed_at timestamptz)
language sql
stable
security definer
set search_path = auth, public
as $$
  select u.id, u.email_confirmed_at
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_auth_user_by_email(text) from public;
revoke all on function public.find_auth_user_by_email(text) from anon;
revoke all on function public.find_auth_user_by_email(text) from authenticated;
grant execute on function public.find_auth_user_by_email(text) to service_role;
