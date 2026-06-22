alter table public.building_modules
  add column if not exists module_data_complete boolean
  generated always as (
    (
      case
        when jsonb_typeof(visualization_blocks) = 'array'
          then jsonb_array_length(visualization_blocks)
        else 0
      end
    ) > 0
    and
    (
      case
        when jsonb_typeof(project_blocks) = 'array'
          then jsonb_array_length(project_blocks)
        else 0
      end
    ) > 0
  ) stored;

create index if not exists building_modules_company_id_completion_idx
on public.building_modules (company_id, module_data_complete);
