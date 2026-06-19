-- App users and system administrator flag (service role only; RLS deny for clients)

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  avatar_url text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_is_admin_idx
on public.users (is_admin)
where is_admin = true;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "users deny client access" on public.users;
create policy "users deny client access"
on public.users
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into public.users (id, email, name, avatar_url, is_admin)
select
  auth_user.id,
  coalesce(auth_user.email, ''),
  coalesce(
    auth_user.raw_user_meta_data ->> 'name',
    auth_user.raw_user_meta_data ->> 'full_name',
    ''
  ),
  coalesce(auth_user.raw_user_meta_data ->> 'avatar_url', ''),
  exists (
    select 1
    from public.user_group_members membership
    join public.user_groups user_group on user_group.id = membership.group_id
    where membership.user_id = auth_user.id
      and user_group.slug = 'admin'
  )
from auth.users auth_user
on conflict (id) do update
set
  email = excluded.email,
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  updated_at = now();
