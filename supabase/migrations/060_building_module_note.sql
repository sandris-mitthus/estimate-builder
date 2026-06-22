alter table public.building_modules
  add column if not exists note text not null default '';

update public.building_modules
set note = left(trim(note), 255)
where note <> left(trim(note), 255);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'building_modules_note_length_check'
      and conrelid = 'public.building_modules'::regclass
  ) then
    alter table public.building_modules
      add constraint building_modules_note_length_check
      check (char_length(note) <= 255);
  end if;
end;
$$;

with translations (translation_key, namespace, description, lv, en) as (
  values
    ('common.note', 'common', '', 'Piezīme', 'Note'),
    ('modules.note.placeholder', 'modules', '', 'Piemēram: Spogulis', 'Example: Mirror'),
    ('modules.validation.note_too_long', 'modules', '', 'Piezīme nedrīkst būt garāka par 255 zīmēm.', 'The note must be no longer than 255 characters.')
)
insert into public.site_translations (translation_key, namespace, description, values)
select
  translation_key,
  namespace,
  description,
  jsonb_build_object('lv', lv, 'en', en)
from translations
on conflict (translation_key) do update
set
  namespace = excluded.namespace,
  description = excluded.description,
  values = public.site_translations.values || excluded.values,
  updated_at = now();
