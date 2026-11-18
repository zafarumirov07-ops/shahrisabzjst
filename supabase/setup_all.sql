-- Shahrisabz texnikumi: BIR MARTA ishga tushiriladigan to'liq o'rnatish (sxema + eski saytdan ko'chirilgan ma'lumotlar).
-- Supabase, SQL Editor, New query ichiga to'liq nusxalab, Run bosing.

-- ===== 1/2: SXEMA =====
-- =====================================================================
-- Shahrisabz Abu Ali ibn Sino nomidagi jamoat salomatligi texnikumi
-- Boshlang'ich sxema: kontent, rollar, RLS, audit log, statistika, storage
-- Ko'p tilli maydonlar jsonb ko'rinishida: {"uz": "...", "ru": "...", "en": "..."}
-- site: 'main' (asosiy sayt) yoki 'talimsifati' (talimsifati subdomeni)
-- =====================================================================

-- ---------- Enumlar ----------
do $$ begin
  create type public.app_role as enum ('pending', 'editor', 'quality_editor', 'super_admin');
exception when duplicate_object then null; end $$;

-- ---------- Umumiy yordamchi funksiya: updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Profillar (auth.users bilan bog'langan) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratiladi (rol: pending, ya'ni huquqsiz).
-- Rolni faqat super_admin beradi. Eng birinchi foydalanuvchi avtomatik super_admin bo'ladi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when first_user then 'super_admin'::public.app_role else 'pending'::public.app_role end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Rol yordamchilari (RLS uchun) ----------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('editor', 'quality_editor', 'super_admin'), false)
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'super_admin', false)
$$;

-- Foydalanuvchi shu sayt kontentini boshqara oladimi?
--   super_admin  -> hamma narsa
--   editor       -> faqat 'main'
--   quality_editor -> faqat 'talimsifati'
create or replace function public.can_manage_site(target_site text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case public.current_app_role()
    when 'super_admin' then true
    when 'editor' then target_site = 'main'
    when 'quality_editor' then target_site = 'talimsifati'
    else false
  end
$$;

-- Profillar uchun RLS
alter table public.profiles enable row level security;

create policy "profiles: o'zini yoki super_admin ko'radi" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_super_admin());

create policy "profiles: faqat super_admin o'zgartiradi" on public.profiles
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------- Kategoriyalar ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  slug text not null,
  name jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (site, slug)
);

-- ---------- Postlar (yangiliklar va e'lonlar) ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  kind text not null default 'news' check (kind in ('news', 'announcement')),
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  -- Kelajakdagi sana qo'yilsa, post o'sha vaqtda avtomatik ko'rinadi (rejalashtirilgan post)
  published_at timestamptz,
  title jsonb not null default '{}'::jsonb,
  excerpt jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,        -- Markdown matn
  cover_url text,
  category_id uuid references public.categories (id) on delete set null,
  pinned boolean not null default false,
  view_count bigint not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site, slug)
);
create index if not exists posts_public_idx on public.posts (site, status, published_at desc);
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- Post biriktirmalari: rasm, video, fayl, tashqi video (YouTube va h.k.)
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'file', 'embed')),
  url text not null,
  title text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists post_media_post_idx on public.post_media (post_id, sort_order);

-- ---------- Statik sahifalar (Biz haqimizda, Qabul qoidalari, Aloqa...) ----------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  slug text not null,
  title jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site, slug)
);
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

-- ---------- Bo'limlar / kafedralar ----------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Jamoa (rahbariyat, o'qituvchilar, mas'ullar) ----------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  group_key text not null default 'teacher' check (group_key in ('leadership', 'teacher', 'staff', 'responsible')),
  department_id uuid references public.departments (id) on delete set null,
  full_name text not null,
  position jsonb not null default '{}'::jsonb,
  bio jsonb not null default '{}'::jsonb,
  photo_url text,
  phone text,
  email text,
  socials jsonb not null default '{}'::jsonb,       -- {"telegram": "...", "instagram": "..."}
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();

-- ---------- Qabul: yo'nalishlar ----------
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  duration jsonb not null default '{}'::jsonb,       -- masalan {"uz": "2 yil 10 oy"}
  study_form jsonb not null default '{}'::jsonb,     -- kunduzgi / sirtqi
  language jsonb not null default '{}'::jsonb,       -- ta'lim tili
  quota int,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger programs_updated_at before update on public.programs
  for each row execute function public.set_updated_at();

-- ---------- Tadbirlar taqvimi ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cover_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_site_start_idx on public.events (site, starts_at);
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ---------- Galereya (albomlar) ----------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  site text not null default 'main' check (site in ('main', 'talimsifati')),
  slug text not null,
  title jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  cover_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site, slug)
);
create trigger albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

create table if not exists public.album_items (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  kind text not null check (kind in ('image', 'video', 'embed')),
  url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists album_items_album_idx on public.album_items (album_id, sort_order);

-- ---------- Sayt sozlamalari (aloqa, ijtimoiy tarmoqlar, bosh sahifa matni) ----------
create table if not exists public.site_settings (
  site text not null check (site in ('main', 'talimsifati')),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (site, key)
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------- Media kutubxonasi ----------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,           -- storage ichidagi yo'l
  url text not null,                   -- ochiq URL
  name text not null,
  mime_type text,
  size_bytes bigint,
  kind text not null default 'file' check (kind in ('image', 'video', 'file')),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists media_created_idx on public.media (created_at desc);

-- ---------- Statistika ----------
create table if not exists public.post_views_daily (
  post_id uuid not null references public.posts (id) on delete cascade,
  day date not null default current_date,
  views int not null default 0,
  primary key (post_id, day)
);

create table if not exists public.page_views_daily (
  site text not null check (site in ('main', 'talimsifati')),
  day date not null default current_date,
  views int not null default 0,
  primary key (site, day)
);

-- Ommaviy sahifa ochilganda chaqiriladi (anon ham chaqira oladi).
create or replace function public.track_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- faqat e'lon qilingan postlar hisoblanadi
  if not exists (
    select 1 from public.posts
    where id = p_post_id and status = 'published' and published_at <= now()
  ) then
    return;
  end if;

  update public.posts set view_count = view_count + 1 where id = p_post_id;

  insert into public.post_views_daily (post_id, day, views)
  values (p_post_id, current_date, 1)
  on conflict (post_id, day) do update set views = public.post_views_daily.views + 1;
end $$;

create or replace function public.track_page_view(p_site text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_site not in ('main', 'talimsifati') then
    return;
  end if;
  insert into public.page_views_daily (site, day, views)
  values (p_site, current_date, 1)
  on conflict (site, day) do update set views = public.page_views_daily.views + 1;
end $$;

grant execute on function public.track_post_view(uuid) to anon, authenticated;
grant execute on function public.track_page_view(text) to anon, authenticated;

-- ---------- Audit log ----------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  user_email text,
  table_name text not null,
  row_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_row_idx on public.audit_log (table_name, row_id);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_row_id text;
begin
  select email into v_email from public.profiles where id = v_uid;

  if tg_op = 'DELETE' then
    v_row_id := to_jsonb(old) ->> 'id';
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, old_data)
    values (v_uid, v_email, tg_table_name, v_row_id, 'DELETE', to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    -- view_count kabi texnik o'zgarishlar jurnalga yozilmaydi
    if (to_jsonb(new) - 'view_count' - 'updated_at') = (to_jsonb(old) - 'view_count' - 'updated_at') then
      return new;
    end if;
    v_row_id := to_jsonb(new) ->> 'id';
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, old_data, new_data)
    values (v_uid, v_email, tg_table_name, v_row_id, 'UPDATE', to_jsonb(old), to_jsonb(new));
    return new;
  else
    v_row_id := to_jsonb(new) ->> 'id';
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, new_data)
    values (v_uid, v_email, tg_table_name, v_row_id, 'INSERT', to_jsonb(new));
    return new;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'posts', 'post_media', 'pages', 'staff', 'departments', 'programs',
    'events', 'albums', 'album_items', 'categories', 'profiles', 'media'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_trigger()', t || '_audit', t);
  end loop;
end $$;

-- site_settings da id yo'q, shuning uchun alohida (row_id = site:key)
create or replace function public.audit_settings_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
begin
  select email into v_email from public.profiles where id = v_uid;
  if tg_op = 'DELETE' then
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, old_data)
    values (v_uid, v_email, 'site_settings', old.site || ':' || old.key, 'DELETE', to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    if new.value = old.value then return new; end if;
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, old_data, new_data)
    values (v_uid, v_email, 'site_settings', new.site || ':' || new.key, 'UPDATE', to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_log (user_id, user_email, table_name, row_id, action, new_data)
    values (v_uid, v_email, 'site_settings', new.site || ':' || new.key, 'INSERT', to_jsonb(new));
    return new;
  end if;
end $$;

create trigger site_settings_audit after insert or update or delete on public.site_settings
  for each row execute function public.audit_settings_trigger();

-- =====================================================================
-- RLS siyosatlari
-- =====================================================================
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.pages enable row level security;
alter table public.departments enable row level security;
alter table public.staff enable row level security;
alter table public.programs enable row level security;
alter table public.events enable row level security;
alter table public.albums enable row level security;
alter table public.album_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.media enable row level security;
alter table public.post_views_daily enable row level security;
alter table public.page_views_daily enable row level security;
alter table public.audit_log enable row level security;

-- --- categories ---
create policy "categories: hamma o'qiydi" on public.categories for select using (true);
create policy "categories: yozish" on public.categories for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- posts ---
create policy "posts: ommaviy o'qish" on public.posts for select
  using (status = 'published' and published_at <= now());
create policy "posts: xodim o'qiydi" on public.posts for select to authenticated
  using (public.can_manage_site(site));
create policy "posts: yozish" on public.posts for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- post_media ---
create policy "post_media: ommaviy o'qish" on public.post_media for select
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and p.status = 'published' and p.published_at <= now()
  ));
create policy "post_media: xodim o'qiydi" on public.post_media for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.can_manage_site(p.site)));
create policy "post_media: yozish" on public.post_media for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.can_manage_site(p.site)))
  with check (exists (select 1 from public.posts p where p.id = post_id and public.can_manage_site(p.site)));

-- --- pages ---
create policy "pages: ommaviy o'qish" on public.pages for select using (published);
create policy "pages: xodim o'qiydi" on public.pages for select to authenticated
  using (public.can_manage_site(site));
create policy "pages: yozish" on public.pages for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- departments (faqat asosiy sayt) ---
create policy "departments: hamma o'qiydi" on public.departments for select using (true);
create policy "departments: yozish" on public.departments for all to authenticated
  using (public.can_manage_site('main')) with check (public.can_manage_site('main'));

-- --- staff ---
create policy "staff: ommaviy o'qish" on public.staff for select using (published);
create policy "staff: xodim o'qiydi" on public.staff for select to authenticated
  using (public.can_manage_site(site));
create policy "staff: yozish" on public.staff for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- programs (faqat asosiy sayt) ---
create policy "programs: ommaviy o'qish" on public.programs for select using (published);
create policy "programs: xodim o'qiydi" on public.programs for select to authenticated
  using (public.can_manage_site('main'));
create policy "programs: yozish" on public.programs for all to authenticated
  using (public.can_manage_site('main')) with check (public.can_manage_site('main'));

-- --- events ---
create policy "events: ommaviy o'qish" on public.events for select using (published);
create policy "events: xodim o'qiydi" on public.events for select to authenticated
  using (public.can_manage_site(site));
create policy "events: yozish" on public.events for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- albums ---
create policy "albums: ommaviy o'qish" on public.albums for select
  using (published and published_at <= now());
create policy "albums: xodim o'qiydi" on public.albums for select to authenticated
  using (public.can_manage_site(site));
create policy "albums: yozish" on public.albums for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- album_items ---
create policy "album_items: ommaviy o'qish" on public.album_items for select
  using (exists (
    select 1 from public.albums a
    where a.id = album_id and a.published and a.published_at <= now()
  ));
create policy "album_items: xodim o'qiydi" on public.album_items for select to authenticated
  using (exists (select 1 from public.albums a where a.id = album_id and public.can_manage_site(a.site)));
create policy "album_items: yozish" on public.album_items for all to authenticated
  using (exists (select 1 from public.albums a where a.id = album_id and public.can_manage_site(a.site)))
  with check (exists (select 1 from public.albums a where a.id = album_id and public.can_manage_site(a.site)));

-- --- site_settings ---
create policy "site_settings: hamma o'qiydi" on public.site_settings for select using (true);
create policy "site_settings: yozish" on public.site_settings for all to authenticated
  using (public.can_manage_site(site)) with check (public.can_manage_site(site));

-- --- media ---
create policy "media: xodim o'qiydi" on public.media for select to authenticated
  using (public.is_staff());
create policy "media: xodim qo'shadi" on public.media for insert to authenticated
  with check (public.is_staff());
create policy "media: o'chirish" on public.media for delete to authenticated
  using (public.is_super_admin() or uploaded_by = (select auth.uid()));

-- --- statistika: faqat xodimlar o'qiydi, yozish faqat RPC orqali ---
create policy "post_views: xodim o'qiydi" on public.post_views_daily for select to authenticated
  using (public.is_staff());
create policy "page_views: xodim o'qiydi" on public.page_views_daily for select to authenticated
  using (public.is_staff());

-- --- audit_log: faqat super_admin ---
create policy "audit_log: super_admin o'qiydi" on public.audit_log for select to authenticated
  using (public.is_super_admin());

-- =====================================================================
-- Storage: 'media' bucket (ochiq o'qish, yozish faqat xodimlar)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,   -- 50 MB (Supabase bepul rejasining chegarasi)
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "storage media: xodim yuklaydi" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

create policy "storage media: xodim yangilaydi" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());

create policy "storage media: o'chirish" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());

-- Eslatma: bucket ochiq (public) bo'lgani uchun fayllarni URL orqali hamma ko'ra oladi,
-- shuning uchun storage.objects uchun alohida SELECT siyosati kerak emas.
-- (SELECT siyosati bo'lsa, bucket ichidagi fayllar ro'yxatini ham hamma ola olardi.)


-- ===== 2/2: MA'LUMOTLAR =====
-- Eski saytdan (kasbedu.uz) ko‘chirilgan ma‘lumotlar. Avtomatik yaratilgan: node scripts/build-seed.mjs

-- Qayta ishga tushirish xavfsiz: yozuvlar slug / kalit bo‘yicha yangilanadi.

begin;

insert into public.site_settings (site, key, value) values ('main', 'contact', '{"phone":"+998 90 314 08 77","email":"uygunamirov067@gmail.com","address":{"uz":"Shahrisabz shahri, \"Tutzor\" MFY, Buyuk Ipak yo‘li ko‘chasi, 1-uy","ru":"г. Шахрисабз, МФЙ «Тутзор», улица Буюк Ипак Йули, дом 1","en":"1 Buyuk Ipak Yo''li Street, Tutzor MFY, Shahrisabz"},"working_hours":{"uz":"Qabul komissiyasi: dushanba–shanba, 9:00–17:00","ru":"Приёмная комиссия: понедельник–суббота, 9:00–17:00","en":"Admissions office: Monday–Saturday, 9:00–17:00"}}'::jsonb)
  on conflict (site, key) do update set value = excluded.value;

insert into public.site_settings (site, key, value) values ('main', 'stats', '{"students":"1161","teachers":"50","founded":"1966"}'::jsonb)
  on conflict (site, key) do update set value = excluded.value;

insert into public.site_settings (site, key, value) values ('talimsifati', 'contact', '{"phone":"+998 90 314 08 77","email":"uygunamirov067@gmail.com","address":{"uz":"Shahrisabz shahri, \"Tutzor\" MFY, Buyuk Ipak yo‘li ko‘chasi, 1-uy","ru":"г. Шахрисабз, МФЙ «Тутзор», улица Буюк Ипак Йули, дом 1","en":"1 Buyuk Ipak Yo''li Street, Tutzor MFY, Shahrisabz"}}'::jsonb)
  on conflict (site, key) do update set value = excluded.value;

insert into public.pages (site, slug, title, body, published, sort_order)
  values ('main', 'about', '{"uz":"Texnikum haqida","ru":"О техникуме","en":"About the school"}'::jsonb, '{"uz":"Shahrisabz Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumi — tibbiyot yo‘nalishida o‘rta maxsus mutaxassislar tayyorlaydigan ta’lim muassasasi. Bu yerda talabalar hamshiralik ishi, feldsherlik ishi, funksional diagnostika ishi va farmatsiya kabi yo‘nalishlarda bilim oladi.\n\n## Tarix va infratuzilma\n\n- Texnikum **1966 yilda** tashkil etilgan.\n- **900 o‘rinli** o‘quv binosi.\n- **300 talaba** joylashadigan yotoqxona.\n- **250 o‘rinli** zamonaviy faollar zali.\n- Sport zali.\n- Kutubxona (axborot-resurs markazi) 297,42 m² maydonga ega, 2 ta o‘quv zali va 60 ta o‘rin mavjud.","ru":"Шахрисабзский техникум общественного здоровья имени Абу Али ибн Сино — учебное заведение, готовящее специалистов среднего звена в области медицины. Студенты получают знания по направлениям: сестринское дело, фельдшерское дело, функциональная диагностика и фармация.\n\n## История и инфраструктура\n\n- Техникум основан в **1966 году**.\n- Учебный корпус на **900 мест**.\n- Общежитие на **300 студентов**.\n- Современный актовый зал на **250 мест**.\n- Спортивный зал.\n- Библиотека (информационно-ресурсный центр) площадью 297,42 м², 2 читальных зала, 60 посадочных мест.","en":"Shahrisabz Abu Ali ibn Sino Public Health Technical School is an institution that trains mid-level medical specialists. Students study nursing, paramedic practice, functional diagnostics and pharmacy.\n\n## History and facilities\n\n- Founded in **1966**.\n- A teaching building for **900 students**.\n- A dormitory for **300 students**.\n- A modern assembly hall with **250 seats**.\n- A sports hall.\n- A library (information and resource centre) of 297.42 m² with 2 reading rooms and 60 seats."}'::jsonb, true, 1)
  on conflict (site, slug) do update set title = excluded.title, body = excluded.body, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('feldsherlik-ishi', '{"uz":"Feldsherlik ishi","ru":"Фельдшерское дело","en":"Paramedic practice"}'::jsonb, '{"uz":"Bitiruvchilar davolash-profilaktika muassasalari, poliklinikalar va dorixonalarda o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в лечебно-профилактических учреждениях, поликлиниках и аптеках.","en":"Graduates work as mid-level medical staff in healthcare facilities, polyclinics and pharmacies."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 1)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('tibbiy-profilaktika-ishi', '{"uz":"Tibbiy profilaktika ishi","ru":"Медико-профилактическое дело","en":"Preventive medicine"}'::jsonb, '{"uz":"Bitiruvchilar davolash-profilaktika muassasalari, poliklinikalar va dorixonalarda o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в лечебно-профилактических учреждениях, поликлиниках и аптеках.","en":"Graduates work as mid-level medical staff in healthcare facilities, polyclinics and pharmacies."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 2)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('hamshiralik-ishi', '{"uz":"Hamshiralik ishi","ru":"Сестринское дело","en":"Nursing"}'::jsonb, '{"uz":"Bitiruvchilar davolash-profilaktika muassasalari, poliklinikalar va dorixonalarda o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в лечебно-профилактических учреждениях, поликлиниках и аптеках.","en":"Graduates work as mid-level medical staff in healthcare facilities, polyclinics and pharmacies."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 3)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('farmatsiya', '{"uz":"Farmatsiya","ru":"Фармация","en":"Pharmacy"}'::jsonb, '{"uz":"Bitiruvchilar davolash-profilaktika muassasalari, poliklinikalar va dorixonalarda o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в лечебно-профилактических учреждениях, поликлиниках и аптеках.","en":"Graduates work as mid-level medical staff in healthcare facilities, polyclinics and pharmacies."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 4)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('davolash-ishi', '{"uz":"Davolash ishi","ru":"Лечебное дело","en":"General medicine"}'::jsonb, '{"uz":"Bitiruvchilar davolash-profilaktika muassasalari, poliklinikalar va dorixonalarda o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в лечебно-профилактических учреждениях, поликлиниках и аптеках.","en":"Graduates work as mid-level medical staff in healthcare facilities, polyclinics and pharmacies."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 5)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.programs (slug, name, description, duration, published, sort_order)
  values ('funksional-diagnostika-ishi', '{"uz":"Funksional diagnostika ishi","ru":"Функциональная диагностика","en":"Functional diagnostics"}'::jsonb, '{"uz":"Bitiruvchilar poliklinikalar, shifoxonalar va diagnostika markazlarida EKG, ultratovush va boshqa funksional tekshiruvlarni o‘tkazuvchi o‘rta tibbiyot xodimi sifatida ishlaydi.","ru":"Выпускники работают средними медицинскими работниками в поликлиниках, больницах и диагностических центрах, проводя ЭКГ, УЗИ и другие функциональные исследования.","en":"Graduates work as mid-level medical staff in polyclinics, hospitals and diagnostic centres, performing ECG, ultrasound and other functional examinations."}'::jsonb, '{"uz":"3 yil","ru":"3 года","en":"3 years"}'::jsonb, true, 6)
  on conflict (slug) do update set name = excluded.name, description = excluded.description,
    duration = excluded.duration, sort_order = excluded.sort_order;

insert into public.posts (site, kind, slug, status, published_at, title, excerpt, body, cover_url)
  values ('main', 'news', 'talabalar-turar-joyi-yangi-oquv-yiliga-tayyorlanmoqda', 'published', '2026-08-20T09:00:00+05:00'::timestamptz, '{"uz":"Talabalar turar joyi yangi o‘quv yiliga tayyorlanmoqda."}'::jsonb, '{"uz":"Yangi 2026/2027-o‘quv yilini munosib kutib olish uchun talabalar turar joyida keng ko‘lamli tayyorgarlik ishlari olib borilmoqda."}'::jsonb, '{"uz":"Shahrisabz Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumi talabalar turar joyida qizg‘in tayyorgarlik ishlari olib borilmoqda.\n\nYangi 2026/2027-o‘quv yilini munosib kutib olish, talabalar uchun qulay va sanitariya-gigiyena talablariga javob beradigan shart-sharoitlarni yaratish maqsadida Shahrisabz Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumi talabalar turar joyida keng ko‘lamli tayyorgarlik ishlari olib borilmoqda.\n\nAyni kunlarda talabalar turar joyining barcha hududlarida obodonlashtirish, tozalash va tartibga keltirish ishlari qizg‘in davom etmoqda. Xususan, yotoqxonalardagi xonalar, umumiy foydalanish joylari, yo‘laklar hamda sanitariya-gigiyena xonalari tozalanib, zarur sanitariya talablariga muvofiq holatga keltirilmoqda. Xonalarda tozalik va ozodalikka alohida e’tibor qaratilib, talabalar uchun qulay va shinam muhit yaratishga harakat qilinmoqda."}'::jsonb, '/images/import/news-yotoqxona.png')
  on conflict (site, slug) do update set kind = excluded.kind, status = 'published', published_at = excluded.published_at,
    title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_url = excluded.cover_url;

insert into public.posts (site, kind, slug, status, published_at, title, excerpt, body, cover_url)
  values ('talimsifati', 'news', 'farmatsiya-talim-dasturini-takomillashtirish', 'published', '2026-08-13T09:00:00+05:00'::timestamptz, '{"uz":"Farmatsiya ta’lim dasturini takomillashtirish"}'::jsonb, '{"uz":"Ta’lim dasturlarini takomillashtirish bo‘yicha amalga oshirilayotgan ishlar ochiq va shaffof tarzda jamoatchilikka yetkazib borilmoqda."}'::jsonb, '{"uz":"Shahrisabz Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumida ta’lim dasturlarini takomillashtirish bo‘yicha amalga oshirilayotgan ishlar to‘g‘risidagi ma’lumotlar ochiq va shaffof tarzda jamoatchilikka yetkazib borilmoqda.\n\nTa’lim dasturlarining mazmuni va sifatini yanada takomillashtirish maqsadida o‘quvchilar, pedagoglar, ish beruvchilar hamda boshqa manfaatdor tomonlarning fikr-mulohazalari muntazam o‘rganib boriladi. O‘tkazilgan so‘rovnomalar, tahlillar, muhokamalar va takliflar asosida ta’lim dasturlariga tegishli o‘zgartirish va takomillashtirishlar kiritish bo‘yicha chora-tadbirlar amalga oshiriladi.\n\nJumladan, “Hamshiralik ishi”, “Davolash ishi”, “Farmatsiya” va “Funksional diagnostika ishi” ta’lim yo‘nalishlari bo‘yicha ta’lim dasturlarining amaldagi holati, mazmuni, o‘quv natijalari hamda mehnat bozori talablariga muvofiqligi muntazam tahlil qilinadi.\n\nTa’lim dasturlarini takomillashtirish jarayonida:\n\n- o‘quvchilar va pedagoglarning fikr-mulohazalari o‘rganiladi;\n- ish beruvchilar va amaliyotchi mutaxassislarning takliflari tahlil qilinadi;\n- ta’lim dasturlarining mehnat bozori talablariga muvofiqligi baholanadi;\n- o‘quv-me’yoriy hujjatlar takomillashtiriladi;\n- zamonaviy pedagogik va axborot texnologiyalaridan foydalanish imkoniyatlari kengaytiriladi;\n- aniqlangan kamchiliklarni bartaraf etish bo‘yicha tegishli chora-tadbirlar belgilanadi.\n\nTa’lim dasturlarini takomillashtirish natijalari, amalga oshirilgan ishlar hamda tegishli ma’lumotlar texnikumning rasmiy veb-sayti va ijtimoiy tarmoqlardagi sahifalarida muntazam ravishda ochiq e’lon qilib boriladi.\n\nMazkur faoliyat ta’lim sifatini oshirish, ta’lim jarayonining shaffofligini ta’minlash hamda manfaatdor tomonlarning ta’lim dasturlarini takomillashtirishdagi ishtirokini kengaytirishga xizmat qiladi."}'::jsonb, '/images/import/news-farmatsiya.jpg')
  on conflict (site, slug) do update set kind = excluded.kind, status = 'published', published_at = excluded.published_at,
    title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_url = excluded.cover_url;

insert into public.posts (site, kind, slug, status, published_at, title, excerpt, body, cover_url)
  values ('talimsifati', 'news', 'sorovnoma-natijalari-asosida-amalga-oshiriladigan-ishlar', 'published', '2026-08-10T10:00:00+05:00'::timestamptz, '{"uz":"So‘rovnoma natijalari asosida amalga oshiriladigan ishlar."}'::jsonb, '{"uz":"“Davolash ishi” yo‘nalishida o‘tkazilgan onlayn so‘rovnomada 59 nafar talaba ishtirok etdi. Natijalar asosida ta’lim dasturi takomillashtirilmoqda."}'::jsonb, '{"uz":"Shahrisabz Abu Ali ibn Sino nomidagi Jamoat salomatligi texnikumida “Davolash ishi” yo‘nalishida ta’lim sifatini yanada takomillashtirish maqsadida talabalar o‘rtasida amaldagi ta’lim dasturini baholash bo‘yicha onlayn so‘rovnoma o‘tkazildi. So‘rovnomada 59 nafar talaba ishtirok etdi.\n\nSo‘rovnoma natijalari tahlili davomida ta’lim dasturining umumiy samaradorligi ijobiy baholangani bilan bir qatorda, amaliy mashg‘ulotlar hajmini oshirish, zamonaviy tibbiy texnologiyalarni chuqurroq o‘rgatish, klinik amaliyotlarni takomillashtirish va moddiy-texnik bazani mustahkamlash bo‘yicha takliflar bildirilgani aniqlandi.\n\nTalabalar tomonidan bildirilgan takliflar asosida quyidagi o‘zgarish va takomillashtirish ishlari amalga oshirilmoqda:\n\n- amaliy mashg‘ulotlarning hajmi va mazmuni takomillashtirildi, kasbiy ko‘nikmalarni amaliyotda mustahkamlashga yo‘naltirilgan mashg‘ulotlarga ustuvor ahamiyat berildi;\n- o‘quv mashg‘ulotlarida real klinik vaziyatlarga asoslangan amaliy topshiriqlar va vaziyatli masalalardan foydalanish kengaytirildi;\n- talabalarni zamonaviy tibbiyot amaliyotiga tayyorlash maqsadida zamonaviy tibbiy texnologiyalar va diagnostika usullaridan foydalanish bo‘yicha amaliy mashg‘ulotlar kuchaytirildi;\n- klinik va ishlab chiqarish amaliyotlarining samaradorligini oshirish, talabalarni real tibbiy muhitda mustaqil ishlashga tayyorlash bo‘yicha amaliy ishlar kuchaytirildi;\n- amaliy ko‘nikmalarni shakllantirishda simulyatsion mashg‘ulotlar, amaliy topshiriqlar va ko‘nikmalarni bosqichma-bosqich baholash usullaridan foydalanish kengaytirildi;\n- o‘quv xonalari va amaliy laboratoriyalardagi mavjud jihozlardan samarali foydalanish hamda moddiy-texnik bazani bosqichma-bosqich yangilash bo‘yicha ishlar olib borilmoqda;\n- o‘qituvchilarning dars jarayonida interaktiv va innovatsion pedagogik texnologiyalardan foydalanishi yanada kuchaytirildi;\n- talabalar tomonidan bildirilgan takliflarni inobatga olgan holda ta’lim dasturini muntazam takomillashtirib borish mexanizmi yo‘lga qo‘yildi;\n- ta’lim dasturining mehnat bozori talablariga mosligini ta’minlash maqsadida tibbiyot muassasalari va ish beruvchilarning fikr-mulohazalarini o‘rganishga alohida e’tibor qaratilmoqda.\n\n## Natija\n\nAmalga oshirilgan va rejalashtirilgan o‘zgarishlar natijasida “Davolash ishi” yo‘nalishi talabalarining nazariy bilimlarini amaliy ko‘nikmalar bilan uyg‘unlashtirish, klinik vaziyatlarda mustaqil qaror qabul qilish, zamonaviy tibbiy texnologiyalardan foydalanish hamda mehnat bozorida talab etiladigan kasbiy kompetensiyalarini rivojlantirish imkoniyatlari kengaytirilmoqda.\n\nSo‘rovnoma natijalari va talabalar tomonidan bildirilgan takliflar kelgusida ta’lim dasturini takomillashtirishda muhim ichki sifat monitoringi va qayta aloqa mexanizmi sifatida foydalanilmoqda. Mazkur natijalar asosida amalga oshirilayotgan o‘zgarishlar ta’lim sifatini doimiy ravishda “so‘rovnoma → tahlil → taklif → o‘zgarish → qayta monitoring” tamoyili asosida takomillashtirishga xizmat qiladi.\n\nSo‘rovnoma natijalari va ular asosida amalga oshirilgan ishlar texnikumning ta’lim sifatini ichki ta’minlash tizimi doirasida muntazam tahlil qilinib, manfaatdor tomonlar uchun ochiq tarzda e’lon qilib boriladi."}'::jsonb, '/images/import/news-sorovnoma.jpg')
  on conflict (site, slug) do update set kind = excluded.kind, status = 'published', published_at = excluded.published_at,
    title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_url = excluded.cover_url;

insert into public.posts (site, kind, slug, status, published_at, title, excerpt, body, cover_url)
  values ('main', 'news', 'texnikum-arm-faoliyati-haqida', 'published', '2026-08-10T09:00:00+05:00'::timestamptz, '{"uz":"Texnikum ARM faoliyati haqida."}'::jsonb, '{"uz":"Texnikum kutubxonasi (axborot-resurs markazi) 297,42 m² maydonga ega, umumiy fondi 31 722 ta nashrdan iborat."}'::jsonb, '{"uz":"Texnikum kutubxonasida 2 nafar malakali xodim faoliyat yuritib kelmoqda: Raxmonova Sveta Qarshiyevna va Qayumova Gulzoda Yaxyoyevna. Malakali xodimlarimiz malaka oshirish kurslaridan o‘tgan.\n\nTexnikum kutubxonasi 297,42 m² ga ega bo‘lib, xonalar soni 6 ta, o‘quv zali 2 ta, o‘quv zalida o‘rinlar soni 60 ta, ARMda kitob aylanishi 3,1, kitob bilan ta’minlanish 100%, qatnov 15 102 ta, o‘tkazilgan tadbirlar 28 ta, kutubxonaning umumiy fondi 31 722 ta, shundan darsliklar 29 426, badiiy adabiyotlar 812 ta, siyosiy adabiyotlar 1044 ta, elektron darsliklar 632 ta, o‘qitish materiallari to‘plami 42 ta, raqamli ta’lim resurslari 3 ta, multimediyalar 67 ta va turli adabiyotlar 440 ta.\n\nARM fondi to‘g‘risida texnikum saytida to‘liq materiallar kiritilishi tashkil qilindi. Bundan tashqari ARM haqida ma’lumotlar bazasi texnikum saytida kengaytirilgan holda kiritildi."}'::jsonb, '/images/import/news-arm.jpg')
  on conflict (site, slug) do update set kind = excluded.kind, status = 'published', published_at = excluded.published_at,
    title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_url = excluded.cover_url;

do $$
declare a_id uuid;
begin
  insert into public.albums (site, slug, title, description, cover_url, published, published_at)
    values ('main', 'infratuzilma', '{"uz":"Texnikum infratuzilmasi","ru":"Инфраструктура техникума","en":"School facilities"}'::jsonb, '{"uz":"Texnikum binosi va hududidan lavhalar.","ru":"Здание и территория техникума.","en":"The school building and grounds."}'::jsonb, '/images/campus.jpg', true, '2026-08-10T12:00:00+05:00'::timestamptz)
    on conflict (site, slug) do update set title = excluded.title, description = excluded.description,
      cover_url = excluded.cover_url, published_at = excluded.published_at
    returning id into a_id;
  delete from public.album_items where album_id = a_id;
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/campus.jpg', null, 0);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-1.jpg', null, 1);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-2.jpg', null, 2);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-3.jpg', null, 3);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-4.jpg', null, 4);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-5.jpg', null, 5);
    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, 'image', '/images/import/campus-6.jpg', null, 6);
end $$;

commit;


-- ===== 3/3: 2026-11-18 YANGILANISH (qidiruv, yo`nalishlar, tadbir slug) =====
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
