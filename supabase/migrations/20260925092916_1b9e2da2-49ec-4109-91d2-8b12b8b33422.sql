INSERT INTO public.site_addons (sort_order, code, name_ru, name_en, desc_ru, desc_en, price_ru, price_en, note_ru, note_en, is_visible)
SELECT * FROM (VALUES
  (0, 'A — 01', 'Доп. экземпляр', 'Extra Copy', 'Допечатка готовой книги для других членов семьи.', 'A reprint of the finished book for other family members.', '$45 — $120', '$45 — $120', 'за экземпляр', 'per copy', true),
  (1, 'A — 02', 'Цифровой архив', 'Digital Archive', 'Документы, фото, PDF, генеалогия — на флешке или в облаке.', 'Documents, photos, PDF, genealogy — on USB or cloud storage.', '$75', '$75', 'единоразово', 'one-time fee', true),
  (2, 'A — 03', 'Реставрация фото', 'Photo Restoration', 'Ретушь и восстановление старых снимков сверх лимита плана.', 'Retouching and restoration of old photos beyond your plan''s limit.', 'от $15', 'from $15', 'пакет из 10 фото', 'per 10 photos', true),
  (3, 'A — 04', 'Перевод книги', 'Book Translation', 'Перевод на другой язык и повторная вёрстка.', 'Translation into another language and full re-typesetting.', '$200 — $800', '$200 — $800', 'зависит от объёма', 'depends on volume', true),
  (4, 'A — 05', 'Экспресс', 'Express', 'Приоритетная работа, срок сокращается вдвое.', 'Priority work — delivery time cut in half.', '+$150 — +$500', '+$150 — +$500', 'надбавка к плану', 'surcharge on plan', true),
  (5, 'A — 06', 'Постер с древом', 'Family Tree Poster', 'Иллюстрированное генеалогическое древо для оформления в рамку.', 'An illustrated genealogical tree designed for framing.', '$120 — $350', '$120 — $350', 'зависит от глубины', 'depends on depth', true)
) AS seed(sort_order, code, name_ru, name_en, desc_ru, desc_en, price_ru, price_en, note_ru, note_en, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.site_addons);