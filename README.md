# shahrisabzjst.uz

Shahrisabz Abu Ali ibn Sino nomidagi jamoat salomatligi texnikumi rasmiy sayti.

- **Asosiy sayt:** `shahrisabzjst.uz`
- **Ta'lim sifati:** hozircha domensiz `/talimsifati/uz` manzilida (masalan `shahrisabzjst.vercel.app/talimsifati/uz`).
  Domen ulangach Vercel'da `NEXT_PUBLIC_QUALITY_MODE=subdomain` qo'yib Redeploy qilinsa, havolalar
  `talimsifati.shahrisabzjst.uz` ga o'tadi (`/talimsifati/...` manzili ham ishlashda davom etadi).
- **Admin panel:** `/admin` (ikkala hostda ham ochiladi)
- **Stack:** Next.js 15 (App Router), Supabase (Postgres, Storage), Tailwind
- **Dizayn:** havorang va yashil ranglar, to'la kenglik, animatsiyalar (hero, scroll bilan paydo bo'lish, raqam sanash).
  Emoji yo'q, barcha belgilar `src/components/Icon.tsx` dagi SVG ikonlar. Menyu qisqa, "Ta'lim sifati" doim ko'rinadi.

## Admin kirishi (Vercel env orqali)

Admin login va paroli **Vercel, Settings, Environment Variables** da saqlanadi:

| O'zgaruvchi | Vazifasi |
|---|---|
| `ADMIN_LOGIN`, `ADMIN_PASSWORD` | bosh admin (hamma narsa) |
| `SUPABASE_SECRET_KEY` | admin panel bazaga yozishi uchun maxfiy kalit (faqat server) |
| `ADMIN_SESSION_SECRET` | ixtiyoriy, sessiya imzosi uchun uzun tasodifiy matn |
| `EDITOR_LOGIN`, `EDITOR_PASSWORD` | ixtiyoriy: faqat asosiy sayt muharriri |
| `QUALITY_LOGIN`, `QUALITY_PASSWORD` | ixtiyoriy: faqat "Ta'lim sifati" muharriri |

O'zgaruvchilarni o'zgartirgach **Redeploy** qiling. `SUPABASE_SECRET_KEY` ni hech qachon `NEXT_PUBLIC_` bilan boshlamang
va GitHub'ga yozmang. Parol uzun bo'lsin (16+ belgi).

## Ishga tushirish

Node.js 20+ kerak.

```bash
npm install
```

`.env.example` ni `.env.local` ga nusxalab to'ldiring, so'ng:

```bash
npm run dev
```

- Asosiy sayt: http://localhost:3000
- Ta'lim sifati: http://talimsifati.localhost:3000 (Chrome/Edge `*.localhost` ni o'zi taniydi)
- Admin: http://localhost:3000/admin

### Kalitlarsiz ko'rish (demo rejim)
`NEXT_PUBLIC_DEMO=1` bilan ishga tushirsangiz, ommaviy sahifalar eski saytdan ko'chirilgan ma'lumotlar bilan ochiladi
(Supabase kerak emas). Ishlab chiqarishda o'chiq bo'lishi kerak.

## Supabase sozlash

1. SQL Editor da `supabase/setup_all.sql` ni bir marta ishga tushiring (sxema, RLS, audit log, `media` bucket va eski saytdan ko'chirilgan ma'lumotlar).
2. Project Settings, API Keys bo'limidan URL, publishable va secret kalitlarni oling (yuqoridagi env'larga).
3. Supabase Auth foydalanuvchilari kerak emas: kirish env dagi login/parol orqali.

## Eski saytdan ko'chirilgan ma'lumotlar

Manba: kasbedu.uz dagi texnikum sahifasi (2026-11-17). Hammasi `supabase/seed/kasbedu.json` da; SQL undan yaratiladi:

```bash
node scripts/build-seed.mjs
```

Ko'chirilgan: "Texnikum haqida", 6 ta yo'nalish (ta'lim muddati 3 yil), aloqa, ko'rsatkichlar, 4 ta yangilik (rasmlari bilan),
infratuzilma albomi. Rasmlar `public/images/import/` da. Ta'lim sifatiga oid 2 ta post `talimsifati` saytida.

## Kontent qoidalari

- Postlar: qoralama / e'lon qilingan. **Kelajakdagi sana** qo'yilsa, post o'sha vaqtda avtomatik paydo bo'ladi.
- Ko'p tillilik: `uz` (majburiy), `ru`, `en`. Tarjima bo'sh bo'lsa o'zbekcha ko'rsatiladi.
- Matn Markdown'da; rasm, video, fayl va YouTube havolasi postga biriktiriladi.
- Fayllar brauzerdan to'g'ridan-to'g'ri Supabase Storage'ga yuklanadi (imzolangan manzil orqali); bitta fayl 50 MB gacha.
  Rasmlar avtomatik siqiladi. Katta videolar uchun YouTube havolasidan foydalaning.
- Statik sahifalar `/p/<slug>`: `about`, `admission`. Aloqa sahifasi `/contact`, "Sayt sozlamalari" dagi ma'lumotlardan hosil bo'ladi.

## Deploy (Vercel)

1. Loyihani ulang, env'larni kiriting (`NEXT_PUBLIC_ROOT_DOMAIN=shahrisabzjst.uz`), Deploy.
2. Domenlar: `shahrisabzjst.uz`, `www.shahrisabzjst.uz`, `talimsifati.shahrisabzjst.uz`. Vercel ko'rsatgan DNS yozuvlarni domen provayderiga kiriting.

## Tuzilma

```
src/middleware.ts             host bo'yicha sayt, til prefiksi
src/app/[site]/[locale]/...   ommaviy sahifalar (site = main | talimsifati)
src/app/admin/...             admin panel (konfiguratsiya asosida CRUD)
src/lib/admin/session.ts      env asosidagi login va imzolangan sessiya
src/components/Icon.tsx       yagona SVG ikonlar to'plami
src/lib/admin/resources.ts    admin bo'limlari maydonlari
supabase/setup_all.sql        bazani bir martada o'rnatish
```
