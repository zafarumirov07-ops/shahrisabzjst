// Mavjud kontentdagi bo'sh ru/en maydonlarni o'zbekchadan avtomatik tarjima qiladi (bo'sh joyni to'ldiradi,
// qo'lda yozilganga tegmaydi) va "auto_langs" ga belgi qo'yadi. Qayta ishga tushirish xavfsiz va davom ettiriladi.
//
// Bepul MyMemory kuniga ~5000 belgi beradi (MYMEMORY_EMAIL .env.local da bo'lsa ~50000), shuning uchun
// belgilar soni cheklanadi: avval sarlavhalar, keyin qisqa mazmun, oxirida matnlar (yangi postlar birinchi).
//
// Ishlatish:  node scripts/translate-backfill.mjs                    (ko'rish: nechta belgi kerak)
//             node scripts/translate-backfill.mjs --apply            (yozish)
//             node scripts/translate-backfill.mjs --apply --max-chars 4000
// Talab: 20261118000000_search_programs_events.sql migratsiyasi ishga tushirilgan bo'lishi kerak (auto_langs).
import { APPLY, env, fetchAll, getDb, opt, sleep } from './_lib.mjs';
import { TranslateQuotaError, translateMarkdown } from '../src/lib/translate.ts';

const TABLES = {
  posts: { fields: ['title', 'excerpt', 'body'], order: 'published_at' },
  pages: { fields: ['title', 'body'], order: 'updated_at' },
  events: { fields: ['title', 'description', 'location'], order: 'starts_at' },
  albums: { fields: ['title', 'description'], order: 'published_at' },
  programs: { fields: ['name', 'description', 'body'], order: 'sort_order', asc: true },
  departments: { fields: ['name', 'description'], order: 'sort_order', asc: true },
  staff: { fields: ['position', 'bio'], order: 'sort_order', asc: true },
};
const WEIGHT = { title: 0, name: 0, position: 0, location: 1, excerpt: 1, description: 1, bio: 2, body: 3 };
const TARGETS = ['ru', 'en'];

const budget = Number(opt('max-chars', env.MYMEMORY_EMAIL ? 40000 : 4000));
const db = getDb();

const probe = await db.from('posts').select('auto_langs').limit(1);
if (probe.error) {
  console.error('auto_langs ustuni yo‘q. Avval supabase/migrations/20261118000000_search_programs_events.sql ni SQL Editor’da ishga tushiring.');
  process.exit(1);
}

const rows = {};
const tasks = [];
for (const [table, cfg] of Object.entries(TABLES)) {
  const data = await fetchAll(db, table, ['id', 'auto_langs', ...cfg.fields].join(','), (q) =>
    q.order(cfg.order, { ascending: !!cfg.asc }),
  );
  rows[table] = new Map(data.map((r, i) => [r.id, { ...r, _rank: i }]));
  for (const r of rows[table].values()) {
    for (const field of cfg.fields) {
      const v = r[field] ?? {};
      const base = v.uz || v.ru || v.en;
      if (!base) continue;
      const src = v.uz ? 'uz' : v.ru ? 'ru' : 'en';
      for (const L of TARGETS) {
        if (!v[L] && L !== src) tasks.push({ table, id: r.id, field, L, src, chars: v[src].length, w: WEIGHT[field] ?? 2, rank: r._rank });
      }
    }
  }
}
tasks.sort((a, b) => a.w - b.w || a.rank - b.rank);

const total = tasks.reduce((n, t) => n + t.chars, 0);
console.log(`Tarjima kerak: ${tasks.length} ta maydon, jami ~${total} belgi. Bugungi byudjet: ${budget} belgi.`);
const byField = {};
for (const t of tasks) byField[`${t.table}.${t.field}`] = (byField[`${t.table}.${t.field}`] ?? 0) + t.chars;
console.table(byField);
if (!APPLY) {
  console.log('Dry-run: --apply bilan bajariladi.');
  process.exit(0);
}

let used = 0;
let done = 0;
for (const t of tasks) {
  if (used + t.chars > budget) continue; // keyingi, kichikroq maydonlar sig'ishi mumkin
  const row = rows[t.table].get(t.id);
  const cur = { ...(row[t.field] ?? {}) };
  try {
    const text = (await translateMarkdown(cur[t.src], t.src, t.L)).trim();
    used += t.chars;
    if (!text) continue;
    cur[t.L] = text;
    const auto = [...new Set([...(row.auto_langs ?? []), `${t.field}.${t.L}`])].sort();
    const { error } = await db.from(t.table).update({ [t.field]: cur, auto_langs: auto }).eq('id', t.id);
    if (error) throw new Error(error.message);
    row[t.field] = cur;
    row.auto_langs = auto;
    done++;
    if (done % 10 === 0) console.log(`  ${done} ta tayyor (${used} belgi)`);
    await sleep(300);
  } catch (e) {
    if (e instanceof TranslateQuotaError) {
      console.log('Kunlik limit tugadi. Ertaga yoki MYMEMORY_EMAIL bilan qayta ishga tushiring.');
      break;
    }
    console.log(`Xato (${t.table}/${t.field}/${t.L}): ${e.message}`);
  }
}
console.log(`Bajarildi: ${done} ta maydon, ~${used} belgi.`);
