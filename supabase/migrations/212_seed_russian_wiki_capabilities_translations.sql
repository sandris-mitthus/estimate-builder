-- Fill RU for wiki docs keys added after the bulk RU seed (211).

with translations (translation_key, ru) as (
  values
    (
      'wiki.docs.capabilities.catalog.description',
      'Один каталог цен на материалы и механизмы; система предупреждает, когда цены в сметах устарели.'
    ),
    (
      'wiki.docs.capabilities.catalog.title',
      'Каталог цен'
    ),
    (
      'wiki.docs.capabilities.delivery.description',
      'Список материалов, задачи, сотрудники, инструменты и график — в одной системе.'
    ),
    (
      'wiki.docs.capabilities.delivery.title',
      'После утверждения'
    ),
    (
      'wiki.docs.capabilities.exports.description',
      'Брендированное PDF-предложение для клиента и подробная Excel-смета для внутренней проверки.'
    ),
    (
      'wiki.docs.capabilities.exports.title',
      'PDF и Excel'
    ),
    (
      'wiki.docs.capabilities.modules.description',
      'Привяжите количества к типу здания и размерам, чтобы объёмы в проекте обновлялись автоматически.'
    ),
    (
      'wiki.docs.capabilities.modules.title',
      'Модули зданий'
    ),
    (
      'wiki.docs.capabilities.projects.description',
      'Создайте проект с данными клиента, получите смету из шаблона и адаптируйте её под конкретный объект.'
    ),
    (
      'wiki.docs.capabilities.projects.title',
      'Проекты и предложения'
    ),
    (
      'wiki.docs.capabilities.template.description',
      'Один раз постройте структуру сметы; новые проекты начинаются с неё, а не с пустой таблицы.'
    ),
    (
      'wiki.docs.capabilities.template.title',
      'Многоразовый шаблон'
    ),
    (
      'wiki.docs.capabilities.title',
      'Основные возможности'
    ),
    (
      'wiki.docs.get_started.body_1',
      'Estimate Builder — рабочая среда для строительных компаний: в одном месте ведите шаблон сметы и каталог цен, быстро создавайте из них проектное предложение и экспортируйте PDF или Excel.'
    ),
    (
      'wiki.docs.get_started.body_2',
      'Эта документация кратко объясняет основные рабочие процессы. Выберите тему в боковой панели или ниже, чтобы прочитать более подробное описание.'
    ),
    (
      'wiki.docs.get_started.eyebrow',
      'Начните здесь'
    ),
    (
      'wiki.docs.get_started.nav',
      'Начните здесь'
    ),
    (
      'wiki.docs.get_started.title',
      'Что можно сделать в системе?'
    )
)
update public.site_translations as t
set
  values = t.values || jsonb_build_object('ru', translations.ru),
  updated_at = now()
from translations
where t.translation_key = translations.translation_key;
