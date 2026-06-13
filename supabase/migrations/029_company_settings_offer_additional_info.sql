-- Papildus informācija piedāvājumam (viena rinda = viens komentārs)

alter table public.company_settings
  add column if not exists offer_additional_info text not null default '';
