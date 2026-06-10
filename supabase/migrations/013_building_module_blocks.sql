-- Moduļa vizualizāciju un projekta bloki

alter table public.building_modules
  add column if not exists visualization_blocks jsonb not null default '[]'::jsonb,
  add column if not exists project_blocks jsonb not null default '[]'::jsonb;

update public.building_modules
set
  visualization_blocks = '[
    { "id": "vis-1", "title": "3D skats" },
    { "id": "vis-2", "title": "Fasādes renderis" },
    { "id": "vis-3", "title": "Planšets" }
  ]'::jsonb,
  project_blocks = '[
    { "id": "prj-1", "title": "Arhitektūras plānojums" },
    { "id": "prj-2", "title": "Konstrukciju shēma" },
    { "id": "prj-3", "title": "Inženierkomunikācijas" }
  ]'::jsonb
where id = '33333333-3333-3333-3333-333333333301';

update public.building_modules
set
  visualization_blocks = '[
    { "id": "vis-1", "title": "3D skats" },
    { "id": "vis-2", "title": "Teritorijas plāns" }
  ]'::jsonb,
  project_blocks = '[
    { "id": "prj-1", "title": "Karkassa rasējums" },
    { "id": "prj-2", "title": "Fasādes risinājums" },
    { "id": "prj-3", "title": "Apkures shēma" }
  ]'::jsonb
where id = '33333333-3333-3333-3333-333333333302';

update public.building_modules
set
  visualization_blocks = '[
    { "id": "vis-1", "title": "Ārējā vizualizācija" },
    { "id": "vis-2", "title": "Iekštelpu skats" }
  ]'::jsonb,
  project_blocks = '[
    { "id": "prj-1", "title": "Plānojums" },
    { "id": "prj-2", "title": "Griezums" },
    { "id": "prj-3", "title": "Elektroinstalācija" }
  ]'::jsonb
where id = '33333333-3333-3333-3333-333333333303';
