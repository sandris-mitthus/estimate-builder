-- Supabase linter fixes: RLS policies, function search_path, storage listing

-- 1. Trigger function — immutable search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2. schema_migrations — RLS on, no client access (service role bypasses RLS)
alter table public.schema_migrations enable row level security;

revoke all on table public.schema_migrations from anon, authenticated;

drop policy if exists "schema_migrations deny clients" on public.schema_migrations;
create policy "schema_migrations deny clients"
on public.schema_migrations
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

-- 3. App tables — RLS on; client deny added in 006 (replaces interim always-true policies)

-- 4. Storage — remove broad SELECT policy (public bucket URLs still work; listing blocked)
drop policy if exists "Public read company assets" on storage.objects;
