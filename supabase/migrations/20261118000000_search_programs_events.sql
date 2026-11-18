-- =====================================================================
-- 2026-11-18: qidiruv (search_content), yo'nalishlar kengaytmasi, tadbir slug, avto-tarjima belgisi
-- Qayta ishga tushirish xavfsiz (idempotent).
-- =====================================================================

-- ---------- Yo'nalishlar: batafsil matn va rasm ----------
alter table public.programs add column if not exists body jsonb not null default '{}'::jsonb;
alter table public.programs add column if not exists cover_url text;

-- ---------- Tadbirlar: alohida sahifa uchun slug ----------
alter table public.events add column if not exists slug text;
create unique index if not exists events_site_slug_idx on public.events (site, slug) where slug is not null;

-- ---------- Avto-tarjima qilingan tillar (admin'da ko'rsatiladi) ----------
alter table public.posts       add column if not exists auto_langs text[] not null default '{}';
alter table public.pages       add column if not exists auto_langs text[] not null default '{}';
alter table public.events      add column if not exists auto_langs text[] not null default '{}';
alter table public.albums      add column if not exists auto_langs text[] not null default '{}';
alter table public.programs    add column if not exists auto_langs text[] not null default '{}';
alter table public.staff       add column if not exists auto_langs text[] not null default '{}';
alter table public.departments add column if not exists auto_langs text[] not null default '{}';

-- ---------- Qidiruv ----------
-- jsonb {"uz": "...", "ru": "..."} dagi barcha tillar matnini bitta qatorga yig'adi
create or replace function public.i18n_text(j jsonb)
returns text language sql immutable as $$
  select case when jsonb_typeof(j) = 'object'
    then coalesce((select string_agg(value, ' ') from jsonb_each_text(j)), '')
    else '' end
$$;

-- kichik harf, apostrof variantlarini olib tashlaydi (o'zbek = o‘zbek = oʻzbek = ozbek)
create or replace function public.search_norm(t text)
returns text language sql immutable as $$
  select lower(regexp_replace(coalesce(t, ''), '[ʻʼ‘’`´'']', '', 'g'))
$$;

-- Sayt bo'yicha qidiruv: posts (news/announcement), events, albums, programs (faqat main), pages.
-- p_terms: so'zlar (hammasi topilishi kerak), p_types: bo'sh bo'lsa hamma tur.
-- RLS amal qiladi (security invoker): faqat chop etilgan kontent qaytadi.
create or replace function public.search_content(
  p_site text,
  p_terms text[],
  p_types text[] default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  type text, id uuid, slug text, title jsonb, snippet jsonb,
  cover_url text, at timestamptz, total bigint
)
language sql stable security invoker as $$
  with terms as (
    select public.search_norm(t) as t from unnest(p_terms) as t where length(trim(t)) > 0
  ),
  docs as (
    select p.kind as type, p.id, p.slug, p.title, p.excerpt as snippet, p.cover_url,
           p.published_at as at,
           public.search_norm(public.i18n_text(p.title)) as head,
           public.search_norm(public.i18n_text(p.title) || ' ' || public.i18n_text(p.excerpt) || ' ' || public.i18n_text(p.body)) as hay
    from public.posts p
    where p.site = p_site and p.status = 'published' and p.published_at <= now()
    union all
    select 'event', e.id, coalesce(e.slug, e.id::text), e.title, e.description, e.cover_url, e.starts_at,
           public.search_norm(public.i18n_text(e.title)),
           public.search_norm(public.i18n_text(e.title) || ' ' || public.i18n_text(e.description) || ' ' || public.i18n_text(e.location))
    from public.events e where e.site = p_site and e.published
    union all
    select 'album', a.id, a.slug, a.title, a.description, a.cover_url, a.published_at,
           public.search_norm(public.i18n_text(a.title)),
           public.search_norm(public.i18n_text(a.title) || ' ' || public.i18n_text(a.description))
    from public.albums a where a.site = p_site and a.published
    union all
    select 'program', g.id, g.slug, g.name, g.description, g.cover_url, g.created_at,
           public.search_norm(public.i18n_text(g.name)),
           public.search_norm(public.i18n_text(g.name) || ' ' || public.i18n_text(g.description) || ' ' || public.i18n_text(g.body))
    from public.programs g where p_site = 'main' and g.published
    union all
    select 'page', s.id, s.slug, s.title, '{}'::jsonb, null, s.updated_at,
           public.search_norm(public.i18n_text(s.title)),
           public.search_norm(public.i18n_text(s.title) || ' ' || public.i18n_text(s.body))
    from public.pages s where s.site = p_site and s.published
  ),
  hits as (
    select d.*,
           count(*) over () as total
    from docs d
    where (p_types is null or d.type = any (p_types))
      and not exists (select 1 from terms where d.hay not like '%' || replace(replace(terms.t, '%', ''), '_', '') || '%')
      and exists (select 1 from terms)
  )
  select type, id, slug, title, snippet, cover_url, at, total
  from hits
  order by (case when not exists (select 1 from terms where head not like '%' || replace(replace(terms.t, '%', ''), '_', '') || '%') then 0 else 1 end),
           at desc nulls last
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)
$$;

grant execute on function public.search_content(text, text[], text[], int, int) to anon, authenticated;
