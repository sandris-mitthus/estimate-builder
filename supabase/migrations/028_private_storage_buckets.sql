-- Make module-assets bucket private (confidential project PDFs and images)
-- Files are served through the authenticated /api/modules/asset proxy

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'module-assets',
  'module-assets',
  false,
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

-- Make company-assets bucket private (company logo)
-- Files are served through the authenticated /api/company/logo proxy

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  false,
  2097152,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
