// RTR yozuvlariga batafsil tavsif (body) va qisqa mazmun (excerpt) yozadi.
// Ma'lumotlar o'qituvchilarning RTR saytlaridan olingan (2026-11-27).
// Faqat body va excerpt yangilanadi: admin'da kiritilgan ism, rasm va boshqa maydonlarga tegilmaydi.
// Ishlatish:  node scripts/rtr-details.mjs            (faqat ko'rsatadi)
//             node scripts/rtr-details.mjs --apply    (bazaga yozadi)
import { APPLY, getDb } from './_lib.mjs';

const DETAILS = {
  'farmakologiya-va-retseptura-asoslari': {
    excerpt: "50910208 – Hamshiralik ishi · 2026–2027 o'quv yili · 30 mavzu · 90 soat",
    body: `## Resurs haqida

"Farmakologiya va retseptura asoslari" fani bo'yicha interaktiv raqamli ta'lim resursi. Talaba mavzularni ketma-ket o'rganadi, amaliy mashg'ulotlarda interaktiv mashqlarni bajaradi, o'zlashtirish foizi esa sahifada avtomatik ko'rsatib boriladi.

## Kimlar uchun

- **Yo'nalish:** 50910208 – Hamshiralik ishi (Umumiy amaliyot hamshirasi)
- **O'quv yili:** 2026–2027
- **O'qituvchi:** Xazratqulova Saodat

## Tuzilishi

| Jami | Nazariy | Amaliy | Mustaqil ish |
|---|---|---|---|
| 90 soat | 20 soat | 40 soat | 30 soat |

30 ta mavzu 5 ta o'quv natijasiga bo'lingan:

1. **Dori shakllari, retseptura va dozalash** (1–4-mavzular): dori shakllari tasnifi, retsept tuzilishi va yozish qoidalari, dozalarni hisoblash.
2. **Farmakokinetika va farmakodinamika** (5–6-mavzular): dori vositalarining organizmga ta'siri va organizmdagi yo'li.
3. **Dori vositalarini xavfsiz qo'llash va hisobi** (7–10-mavzular): markaziy nerv tizimi preparatlari, narkotik vositalarni saqlash va hisobot, FEFO va min-max tamoyillari, infeksion xavfsizlik.
4. **Asosiy dori guruhlari** (11–26-mavzular): periferik nerv tizimi, yurak-qon tomir, diuretiklar, nafas olish va ovqat hazm qilish tizimi preparatlari, antibiotiklar, immun jarayonlar, allergiya va yallig'lanishga qarshi vositalar; nojo'ya ta'sirlar va signaturani tahlil qilish.
5. **Shoshilinch farmakoterapiya** (27–30-mavzular): dorilardan o'tkir zaharlanish, o'tkir og'riqda analgetik va sedativ vositalar, ABCDE algoritmi, gemostatik preparatlar.

## Qanday foydalaniladi

Resursga o'tib, 1-mavzudan boshlang. Amaliy mavzularda interaktiv mashqlar bor, o'rganilgan mavzular soni saqlanib boradi.`,
  },

  'oftalmologiyada-hamshiralik-ishi': {
    excerpt: "Hamshiralik ishi · 15 mavzu · 42 soat · darslik va testlar",
    body: `## Resurs haqida

Ko'z kasalliklarida bemorni parvarish qilishni o'rganish uchun raqamli darslik. Har bir mavzuda uch bosqich bor: **mavzuni tanlash → o'qish va ko'rish → testni yechish**.

## Kimlar uchun

- **Yo'nalish:** Hamshiralik ishi yo'nalishi talabalari
- **O'qituvchi:** Axmedova Roxila

## Tuzilishi

| Jami | Nazariy | Amaliy |
|---|---|---|
| 42 soat | 16 soat (8 mavzu) | 26 soat (7 mavzu) |

**Mavzular:**

1. Tarix, anatomiya, ko'rish faoliyati
2. Oftalmologik bemorlarda hamshiralik ishi
3. Ko'z kabineti, tekshirish va parvarish (amaliy)
4. Refraksiya va akkomodatsiya (nazariy va amaliy)
5. Qovoq, ko'z yoshi yo'llari va konyunktiva kasalliklari (nazariy va amaliy)
6. Shox, oqsil, tomirli va to'r parda kasalliklari (nazariy va amaliy)
7. Gavhar va shishasimon tana (nazariy va amaliy)
8. Glaukoma, g'ilaylik, o'smalar (nazariy va amaliy)
9. Ko'z shikastlari va ekspertiza (nazariy va amaliy)

## Qanday foydalaniladi

Resursga o'ting, mavzuni tanlang, materialni o'qib chiqing va mavzu oxiridagi test bilan bilimingizni tekshiring.`,
  },

  'tibbiy-psixologiya-va-shaxslararo-muloqot': {
    excerpt: "Hamshiralik ishi va Davolash ishi · I semestr · 2026–2027 o'quv yili · 60 soat",
    body: `## Resurs haqida

"Tibbiy psixologiya va shaxslararo muloqot" fani bo'yicha raqamli ta'lim resursi. Har bir mavzu plakatlar (ko'rgazmali materiallar) bilan boyitilgan, o'zlashtirish darajasi avtomatik hisoblanadi. Resursda ikki yo'nalish uchun alohida dastur bor.

## Kimlar uchun

- **O'quv yili:** 2026–2027, I semestr
- **O'qituvchi:** Axmedova Roxila

| Yo'nalish | Jami | Nazariy | Amaliy | Mustaqil ish | Mavzular |
|---|---|---|---|---|---|
| 50910208 – Hamshiralik ishi | 60 soat | 30 | 10 | 20 | 20 |
| 50910204 – Davolash ishi | 60 soat | 32 | 8 | 20 | 20 |

## Nimalardan tuzilgan

- **Tibbiy psixologiya asoslari:** fanning predmeti va tarixi; ong, sezgi, idrok, diqqat, xotira, tafakkur, nutq, emotsiya va iroda jarayonlari hamda ularning buzilishlari.
- **Psixologik tekshirish:** kuzatish, suhbat, test, anketa; baholash shkalalari (qo'rquv, xavotir, depressiya, stress); natijalarni tahlil qilish va xulosa yozish.
- **Shaxs va bemor psixologiyasi:** shaxs, temperament, xarakter; yoshga xos xususiyatlar; kasallikka psixologik reaksiyalar, stress va koping strategiyalari.
- **Tibbiy etika va deontologiya:** bemor huquqlari, tibbiy maxfiylik, tibbiy etikaning asosiy prinsiplari.
- **Terapevtik muloqot:** faol tinglash, empatiya, bemor va uning yaqinlari bilan professional muloqot, nizoli va inqirozli vaziyatlar. Davolash ishi dasturida "yomon xabar"ni SPIKES usulida yetkazish treningi ham bor.
- **Amaliy mashg'ulotlar:** bemorni psixologik tekshirish, vaziyatli masalalar (case-study), rolli o'yinlar.

## Qanday foydalaniladi

Resursga o'ting, sahifa yuqorisida o'z yo'nalishingizni (Hamshiralik ishi yoki Davolash ishi) tanlang va 1-mavzudan boshlang.`,
  },

  'kasbiy-faoliyatning-huquqiy-asoslari-va-bioetika': {
    excerpt: "Davolash ishi, Farmatsiya, Tibbiy profilaktika · I semestr · 2026–2027 o'quv yili",
    body: `## Resurs haqida

"Kasbiy faoliyatning huquqiy asoslari va Bioetika" fani bo'yicha raqamli ta'lim resursi. Mavzular plakatlar bilan ko'rsatilgan, o'zlashtirish darajasi avtomatik hisoblanadi. Uch yo'nalish uchun alohida dastur bor.

## Kimlar uchun

- **O'quv yili:** 2026–2027, I semestr
- **O'qituvchi:** Komilova Laylo

| Yo'nalish | Guruh | Jami | Nazariy | Amaliy | Mustaqil ish | Mavzular |
|---|---|---|---|---|---|---|
| 50910204 – Davolash ishi | 110–111 | 64 soat | 40 | 0 | 24 | 20 |
| 50910402 – Farmatsiya | 112 | 66 soat | 32 | 10 | 24 | 21 |
| 40910302 – Tibbiy profilaktika | 114 | 72 soat | 36 | 12 | 24 | 24 |

## Nimalardan tuzilgan

- **Mehnat huquqi asoslari:** fanning predmeti, asosiy tamoyillari va manbalari, mehnatga oid huquqiy munosabatlar.
- **Bioetika:** bioetika modulining vazifalari va bioetika ta'limoti.
- **Mehnat shartnomasi:** tushunchasi, mazmuni, tuzish tartibi, o'zgartirish va bekor qilish; jamoa shartnomasi va jamoa kelishuvi.
- **Ish va dam olish vaqti:** ish vaqti, dam olish vaqti, mehnat ta'tillari.
- **Bandlik va mehnatga haq to'lash:** aholini ish bilan ta'minlash, kafolatlar, bandlik xizmati, kafolatli va kompensatsiya to'lovlari.
- **Tibbiyot xodimining huquq va burchlari:** mehnat intizomi, moddiy javobgarlik, ayrim toifa xodimlarga beriladigan qo'shimcha kafolat va imtiyozlar.
- **Mehnat nizolari:** yakka va jamoaviy nizolarni hal qilish, sud tartibi.

## Qanday foydalaniladi

Resursga o'ting, sahifa yuqorisida o'z yo'nalishingizni tanlang. Mavzular ro'yxati va soatlar shu yo'nalish dasturiga moslashadi.`,
  },

  'inson-hayoti-davomida-rivojlanishi': {
    excerpt: "Pearson BTEC · 1-modul · 2026–2027 o'quv yili · 20 dars · 60 soat",
    body: `## Resurs haqida

Pearson BTEC "Sog'liqni saqlash va ijtimoiy parvarish" dasturining **1-moduli: Inson hayoti davomida rivojlanishi** bo'yicha interaktiv raqamli ta'lim resursi. Darslarda interaktiv mashqlar bor, modul ichida ikkita baholash topshirig'i (1.1 va 1.2) mavjud.

## Kimlar uchun

- **Dastur:** Pearson BTEC — Sog'liqni saqlash va ijtimoiy parvarish
- **O'quv yili:** 2026–2027
- **O'qituvchi:** Majidova Nigina

## Tuzilishi

| Jami | Darslar | Bir dars | O'quv maqsadlari |
|---|---|---|---|
| 60 soat | 20 ta | 3 soat | 3 ta (A, B, C) |

**A. Hayot bosqichlari davomida inson o'sishi va rivojlanishi** (1–8-darslar)
Yaxlit rivojlanish (PIES): go'daklik (0–2 yosh), erta bolalik (3–8), o'smirlik (9–18), erta kattalik (19–45), o'rta kattalik (46–65) va keksalik (65+) davrlarida jismoniy, intellektual, hissiy va ijtimoiy rivojlanish; bog'lanish nazariyalari.

**B. Rivojlanishga ta'sir qiluvchi omillar** (9–14-darslar)
Genetik omillar va "tabiat va tarbiya" bahsi, turmush tarzi va ona salomatligi, sog'liqni saqlashdagi tengsizliklar, atrof-muhit, iqtisodiy va kasbiy ta'sirlar. **1.1-baholash topshirig'i.**

**C. Salomatlikni mustahkamlash va parvarish** (15–20-darslar)
Turli hayot bosqichlarida keng tarqalgan sog'liq holatlari, kasalliklarning oldini olish strategiyalari, sog'liqni saqlash va ijtimoiy parvarish mutaxassislarining roli, ko'p tarmoqli va shaxsga yo'naltirilgan parvarish. **1.2-baholash topshirig'i.**

## Qanday foydalaniladi

Resursga o'tib, 1-darsdan boshlang. O'rganilgan darslar soni saqlanib boradi.`,
  },
};

for (const [slug, d] of Object.entries(DETAILS)) console.log(`- ${slug}: ${d.body.length} belgi`);
if (!APPLY) {
  console.log('\nDry-run. Bazaga yozish uchun: node scripts/rtr-details.mjs --apply');
  process.exit(0);
}

const db = getDb();
let ok = 0;
for (const [slug, d] of Object.entries(DETAILS)) {
  const { data, error } = await db
    .from('posts')
    .update({ body: { uz: d.body }, excerpt: { uz: d.excerpt } })
    .eq('site', 'main')
    .eq('kind', 'resource')
    .eq('slug', slug)
    .select('id');
  if (error) console.error(`✗ ${slug}: ${error.message}`);
  else if (!data.length) console.error(`✗ ${slug}: topilmadi`);
  else ok++;
}
console.log(`\nYangilandi: ${ok} / ${Object.keys(DETAILS).length}`);
