-- Moduļu faili (vizualizācijas attēli, projekta PDF)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-assets',
  'module-assets',
  true,
  20971520,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Noņem vecos parauga blokus bez failiem
update public.building_modules
set
  visualization_blocks = '[]'::jsonb,
  project_blocks = '[]'::jsonb;
