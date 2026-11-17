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
