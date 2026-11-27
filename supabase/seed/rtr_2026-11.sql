-- =====================================================================
-- Raqamli ta'lim resurslari (RTR): o'qituvchilar saytlari (2026-11-27)
-- Avval migrations/20261127000000_library_resources.sql ishga tushirilgan bo'lishi kerak.
-- Qayta ishga tushirish xavfsiz: slug bo'yicha yangilanadi.
-- Ma'lumotlar o'qituvchilar saytlaridan olingan. Majidova ning ismi saytda yo'q:
-- admin paneldan to'ldiring.
-- =====================================================================

insert into public.posts (site, kind, slug, status, published_at, author, external_url, title, excerpt)
values
  ('main', 'resource', 'farmakologiya-va-retseptura-asoslari', 'published', now(),
   'Xazratqulova Saodat', 'https://xazratqulova-farmakalogiya.vercel.app',
   '{"uz": "Farmakologiya va retseptura asoslari"}',
   '{"uz": "30 mavzu · 90 soat (20 nazariy, 40 amaliy, 30 mustaqil)"}'),

  ('main', 'resource', 'oftalmologiyada-hamshiralik-ishi', 'published', now(),
   'Axmedova Roxila', 'https://axmedova-oftolmalogiya.vercel.app',
   '{"uz": "Oftalmologiyada hamshiralik ishi"}',
   '{"uz": "Ko''z kasalliklarida bemorni parvarish qilishni o''rganish uchun raqamli darslik · 15 mavzu"}'),

  ('main', 'resource', 'tibbiy-psixologiya-va-shaxslararo-muloqot', 'published', now(),
   'Axmedova Roxila', 'https://axmedova-psixalogiya.vercel.app',
   '{"uz": "Tibbiy psixologiya va shaxslararo muloqot"}',
   '{"uz": "50910208 – Hamshiralik ishi · I semestr · 60 soat · 20 mavzu"}'),

  ('main', 'resource', 'kasbiy-faoliyatning-huquqiy-asoslari-va-bioetika', 'published', now(),
   'Komilova Laylo', 'https://komilova-huquq.vercel.app',
   '{"uz": "Kasbiy faoliyatning huquqiy asoslari va Bioetika"}',
   '{"uz": "50910204 – Davolash ishi · I semestr · 64 soat · 20 mavzu"}'),

  ('main', 'resource', 'inson-hayoti-davomida-rivojlanishi', 'published', now(),
   'Majidova', 'https://majidova-ihdj.vercel.app',
   '{"uz": "Inson hayoti davomida rivojlanishi (1-modul)"}',
   '{"uz": "Pearson BTEC · 20 dars · 60 soat"}')
on conflict (site, slug) do update
  set kind = excluded.kind,
      author = excluded.author,
      external_url = excluded.external_url,
      title = excluded.title,
      excerpt = excluded.excerpt,
      status = 'published';
