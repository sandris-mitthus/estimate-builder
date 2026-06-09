-- Demo projects (fixed UUIDs for stable local links after migrate)

insert into public.projects (id, name, address)
values
  (
    '11111111-1111-1111-1111-111111111101',
    'Biroja ēkas 1. stāva renovācija',
    'Brīvības iela 45, Rīga, LV-1010'
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Daudzdzīvokļu mājas fasādes atjaunošana',
    'Daugavgrīvas iela 12, Rīga, LV-1048'
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Ražotnes noliktavas jaunbūve',
    'Industriālais bulvāris 7, Jelgava, LV-3004'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Viesnīcas numuru kompleksā remonts',
    'Elizabetes iela 22, Rīga, LV-1050'
  )
on conflict (id) do nothing;
