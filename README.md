# shahrisabzjst.uz

Shahrisabz Abu Ali ibn Sino nomidagi jamoat salomatligi texnikumi rasmiy sayti.

- **Asosiy sayt:** `shahrisabzjst.uz`
- **Ta'lim sifati:** `talimsifati.shahrisabzjst.uz` (bitta loyiha, host bo'yicha ajratiladi)
- **Admin panel:** `/admin` (ikkala hostda ham ochiladi)
- **Stack:** Next.js 15 (App Router), Supabase (Postgres, Auth, Storage), Tailwind
- **Dizayn:** iOS uslubi (shishasimon panel, yumaloq kartalar, pastki tab bar, segmentli til almashtirgich).
  Emoji ishlatilmaydi, barcha belgilar `src/components/Icon.tsx` dagi SVG ikonlar.

## Ishga tushirish

Node.js 20+ kerak.

```bash
npm install
```

`.env.example` ni `.env.local` ga nusxalab, Supabase kalitlarini kiriting:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

```bash
npm run dev
```

- Asosiy sayt: http://localhost:3000
- Ta'lim sifati: http://talimsifati.localhost:3000 (Chrome/Edge `*.localhost` ni o'zi taniydi)
- Admin: http://localhost:3000/admin

### Kalitlarsiz ko'rish (demo rejim)

Supabase ulanmagan bo'lsa ham saytni eski saytdan ko'chirilgan ma'lumotlar bilan ko'rish mumkin:

```bash
# PowerShell
$env:NEXT_PUBLIC_DEMO='1'; npm run dev
```

Demo rejim faqat ommaviy sahifalar uchun; admin panel Supabase talab qiladi. Ishlab chiqarishda o'chirilgan bo'lishi kerak.

## Supabase sozlash

1. `supabase/migrations/20261117000000_init.sql` faylini Supabase **SQL Editor** da bir marta ishga tushiring
   (jadvallar, RLS, rollar, audit log, statistika, `media` storage bucket).
2. **Authentication, Users, Add user** bo'limidan o'zingizning email/parolingiz bilan hisob yarating.
   **Birinchi** yaratilgan hisob avtomatik `super_admin` bo'ladi.
3. Eski saytdan ko'chirilgan ma'lumotlarni yuklash uchun `supabase/seed/kasbedu_import.sql` ni SQL Editor da ishga tushiring
   (qayta ishga tushirish xavfsiz, yozuvlar slug bo'yicha yangilanadi).
4. `/admin/login` orqali kiring. Qolgan xodimlarni ham shu yerdan (Auth, Add user) qo'shib,
   `/admin/users` sahifasida rol bering.

## Eski saytdan ko'chirilgan ma'lumotlar

Manba: kasbedu.uz dagi texnikum sahifasi (2026-11-17). Hammasi `supabase/seed/kasbedu.json` da; SQL undan yaratiladi:

```bash
node scripts/build-seed.mjs
```

Ko'chirilgan: "Texnikum haqida" matni, 6 ta yo'nalish, aloqa ma'lumotlari, ko'rsatkichlar (talabalar, o'qituvchilar, yil),
4 ta yangilik (rasmlari bilan), infratuzilma albomi. Rasmlar `public/images/import/` da.
Ta'lim sifatiga oid 2 ta post `talimsifati` saytiga, qolganlari asosiy saytga qo'yilgan (admin paneldan o'zgartirish mumkin).

## Rollar

| Rol | Imkoniyat |
|---|---|
| `super_admin` | Hamma narsa, foydalanuvchilar va tahrir tarixi |
| `editor` | Faqat asosiy sayt kontenti |
| `quality_editor` | Faqat `talimsifati` subdomeni kontenti |
| `pending` | Yangi hisob, hech narsa qila olmaydi |

Ruxsatlar frontendda emas, **Postgres RLS** siyosatlarida tekshiriladi.

## Kontent qoidalari

- Postlar: qoralama / e'lon qilingan. **Kelajakdagi sana** qo'yilsa, post o'sha vaqtda avtomatik paydo bo'ladi (cron kerak emas).
- Ko'p tillilik: `uz` (majburiy), `ru`, `en`. Tarjima bo'sh bo'lsa o'zbekcha ko'rsatiladi.
- Matn Markdown'da yoziladi; rasm, video, fayl, YouTube havolasi postga biriktiriladi.
- Fayl yuklash brauzerdan to'g'ridan-to'g'ri Supabase Storage'ga ketadi; bitta fayl 50 MB gacha
  (bepul reja chegarasi). Rasmlar avtomatik siqiladi. Katta videolar uchun YouTube havolasidan foydalaning.
- Statik sahifalar `/p/<slug>`: `about` (Texnikum haqida), `admission` (Qabul qoidalari matni). Aloqa sahifasi `/contact`,
  u "Sayt sozlamalari" dagi ma'lumotlardan hosil bo'ladi.

## Deploy (Vercel tavsiya)

1. Loyihani Vercel'ga ulang, yuqoridagi 3 ta env o'zgaruvchini kiriting (`NEXT_PUBLIC_ROOT_DOMAIN=shahrisabzjst.uz`).
2. Domenlar: `shahrisabzjst.uz`, `www.shahrisabzjst.uz` va `talimsifati.shahrisabzjst.uz` ni qo'shing
   (yoki DNS'da wildcard `*` CNAME ni `cname.vercel-dns.com` ga yo'naltiring).
3. Supabase, Authentication, URL Configuration bo'limida Site URL: `https://shahrisabzjst.uz`.

## Tuzilma

```
src/middleware.ts             host bo'yicha sayt, til prefiksi, /admin
src/app/[site]/[locale]/...   ommaviy sahifalar (site = main | talimsifati)
src/app/admin/...             admin panel (konfiguratsiya asosida CRUD)
src/components/Icon.tsx       yagona SVG ikonlar to'plami
src/lib/admin/resources.ts    admin bo'limlari maydonlari shu yerda
src/lib/i18n/dictionaries.ts  interfeys tarjimalari
supabase/migrations/          ma'lumotlar bazasi sxemasi
supabase/seed/                eski saytdan ko'chirilgan ma'lumotlar
public/logo.png               logotip (aylana shaklida kesilgan)
public/images/campus.jpg      texnikum binosi
```
