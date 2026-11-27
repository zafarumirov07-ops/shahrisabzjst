-- =====================================================================
-- 2026-11-27: "Elektron kutubxona" (kind = 'library') va
--             "Raqamli ta'lim resurslari" - RTR (kind = 'resource') bo'limlari.
-- Ular posts jadvalida saqlanadi (admin paneldan post kabi joylanadi).
-- Qayta ishga tushirish xavfsiz (idempotent).
-- =====================================================================

-- posts.kind endi 4 xil qiymat qabul qiladi
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts
  add constraint posts_kind_check
  check (kind in ('news', 'announcement', 'library', 'resource'));

-- O'qituvchi (RTR uchun) yoki kitob muallifi
alter table public.posts add column if not exists author text;

-- Tashqi havola: resurs yoki kitob joylashgan sayt manzili (ixtiyoriy)
alter table public.posts add column if not exists external_url text;
