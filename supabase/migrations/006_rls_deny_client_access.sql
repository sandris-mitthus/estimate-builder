-- Replace "always true" authenticated policies with explicit client deny.
-- Server uses service role (bypasses RLS). Browser/anon must not read tables via PostgREST.

drop policy if exists "authenticated full access projects" on public.projects;
drop policy if exists "projects deny client access" on public.projects;
create policy "projects deny client access"
on public.projects
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "authenticated full access estimates" on public.estimates;
drop policy if exists "estimates deny client access" on public.estimates;
create policy "estimates deny client access"
on public.estimates
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "authenticated full access company_settings" on public.company_settings;
drop policy if exists "company_settings deny client access" on public.company_settings;
create policy "company_settings deny client access"
on public.company_settings
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
