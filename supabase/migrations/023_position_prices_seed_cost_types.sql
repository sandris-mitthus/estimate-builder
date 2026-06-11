-- Kataloga sēklas pozīcijām pareizs izmaksu veids (materiāls / mehānisms)

update public.position_prices
set cost_type = 'materials'
where id = '22222222-2222-2222-2222-222222222203';

update public.position_prices
set cost_type = 'mechanisms'
where id = '22222222-2222-2222-2222-222222222204';
