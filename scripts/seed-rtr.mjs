// Raqamli ta'lim resurslari (RTR): o'qituvchilar saytlarini posts jadvaliga kiritadi.
// Avval supabase/migrations/20261127000000_library_resources.sql bazada ishga tushirilgan bo'lishi kerak.
// Ishlatish:  node scripts/seed-rtr.mjs            (faqat ko'rsatadi)
//             node scripts/seed-rtr.mjs --apply    (bazaga yozadi; slug bo'yicha yangilaydi)
import { APPLY, getDb } from './_lib.mjs';

const RTR = [
  {
    slug: 'farmakologiya-va-retseptura-asoslari',
    author: 'Xazratqulova Saodat',
    external_url: 'https://xazratqulova-farmakalogiya.vercel.app',
    title: 'Farmakologiya va retseptura asoslari',
    excerpt: '30 mavzu · 90 soat (20 nazariy, 40 amaliy, 30 mustaqil)',
  },
  {
    slug: 'oftalmologiyada-hamshiralik-ishi',
    author: 'Axmedova Roxila',
    external_url: 'https://axmedova-oftolmalogiya.vercel.app',
    title: 'Oftalmologiyada hamshiralik ishi',
    excerpt: "Ko'z kasalliklarida bemorni parvarish qilishni o'rganish uchun raqamli darslik · 15 mavzu",
  },
  {
    slug: 'tibbiy-psixologiya-va-shaxslararo-muloqot',
    author: 'Axmedova Roxila',
    external_url: 'https://axmedova-psixalogiya.vercel.app',
    title: 'Tibbiy psixologiya va shaxslararo muloqot',
    excerpt: '50910208 – Hamshiralik ishi · I semestr · 60 soat · 20 mavzu',
  },
  {
    slug: 'kasbiy-faoliyatning-huquqiy-asoslari-va-bioetika',
    author: 'Komilova Laylo',
    external_url: 'https://komilova-huquq.vercel.app',
    title: 'Kasbiy faoliyatning huquqiy asoslari va Bioetika',
    excerpt: '50910204 – Davolash ishi · I semestr · 64 soat · 20 mavzu',
  },
  {
    slug: 'inson-hayoti-davomida-rivojlanishi',
    author: 'Majidova Nigina',
    external_url: 'https://majidova-ihdj.vercel.app',
    title: 'Inson hayoti davomida rivojlanishi (1-modul)',
    excerpt: 'Pearson BTEC · 20 dars · 60 soat',
  },
];

const rows = RTR.map((r) => ({
  site: 'main',
  kind: 'resource',
  status: 'published',
  published_at: new Date().toISOString(),
  slug: r.slug,
  author: r.author,
  external_url: r.external_url,
  title: { uz: r.title },
  excerpt: { uz: r.excerpt },
}));

for (const r of rows) console.log(`- ${r.author}: ${r.title.uz}  ->  ${r.external_url}`);

if (!APPLY) {
  console.log('\nDry-run. Bazaga yozish uchun: node scripts/seed-rtr.mjs --apply');
  process.exit(0);
}

const db = getDb();
const { data, error } = await db.from('posts').upsert(rows, { onConflict: 'site,slug' }).select('id, slug');
if (error) {
  console.error('Xatolik:', error.message);
  if (/author|external_url|posts_kind_check/.test(error.message)) {
    console.error('Avval migratsiyani ishga tushiring: supabase/migrations/20261127000000_library_resources.sql');
  }
  process.exit(1);
}
console.log(`\nYozildi: ${data.length} ta RTR`);
