// Postlardagi barcha rasmlardan oy bo'yicha galereya albomlari yasaydi ("Noyabr 2026" va h.k.), saytlar alohida.
// Rasmlar qayta yuklanmaydi (mavjud URL ishlatiladi). Qayta ishga tushirish xavfsiz: albom (site, slug) bo'yicha yangilanadi,
// uning rasmlari qayta yoziladi. Qo'lda yaratilgan albomlarga tegilmaydi.
//
// Ishlatish:  node scripts/build-albums.mjs            (ko'rish)
//             node scripts/build-albums.mjs --apply    (yozish)
import { APPLY, fetchAll, getDb } from './_lib.mjs';

const MONTHS = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const SKIP_SLUGS = new Set(['test']);
const MAX_PER_ALBUM = 150;

const db = getDb();
const posts = await fetchAll(db, 'posts', 'id,site,slug,published_at,title,cover_url', (q) =>
  q.order('published_at', { ascending: false }),
);
const media = await fetchAll(db, 'post_media', 'post_id,url,sort_order,kind', (q) => q.eq('kind', 'image').order('sort_order'));
const mediaByPost = new Map();
for (const m of media) {
  if (!mediaByPost.has(m.post_id)) mediaByPost.set(m.post_id, []);
  mediaByPost.get(m.post_id).push(m.url);
}

// Toshkent vaqti bo'yicha oy
const tzMonth = (iso) => {
  const d = new Date(new Date(iso).getTime() + 5 * 3600 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
};

const albums = new Map(); // `${site}|${YYYY-MM}` -> {site, y, m, items:[], latest}
for (const p of posts) {
  if (SKIP_SLUGS.has(p.slug) || !p.published_at) continue;
  const urls = [...new Set([p.cover_url, ...(mediaByPost.get(p.id) ?? [])].filter(Boolean))];
  if (!urls.length) continue;
  const { y, m } = tzMonth(p.published_at);
  const key = `${p.site}|${y}-${String(m + 1).padStart(2, '0')}`;
  if (!albums.has(key)) albums.set(key, { site: p.site, y, m, items: [], latest: p.published_at, seen: new Set() });
  const a = albums.get(key);
  for (const u of urls) {
    if (a.seen.has(u)) continue;
    a.seen.add(u);
    a.items.push({ url: u, caption: p.title?.uz ?? null });
  }
}

const list = [...albums.entries()].sort((a, b) => b[0].localeCompare(a[0]));
let total = 0;
for (const [key, a] of list) {
  total += Math.min(a.items.length, MAX_PER_ALBUM);
  console.log(`${key}\t${a.items.length} rasm`);
}
console.log(`Albomlar: ${list.length}, jami rasm: ${total}`);
if (!APPLY) {
  console.log('Dry-run: --apply bilan yoziladi.');
  process.exit(0);
}

let done = 0;
for (const [key, a] of list) {
  const [site, ym] = key.split('|');
  const items = a.items.slice(0, MAX_PER_ALBUM);
  const title = { uz: `${MONTHS.uz[a.m]} ${a.y}`, ru: `${MONTHS.ru[a.m]} ${a.y}`, en: `${MONTHS.en[a.m]} ${a.y}` };
  const row = {
    site,
    slug: ym,
    title,
    description: {},
    cover_url: items[0].url,
    published: true,
    published_at: a.latest,
  };
  const { data, error } = await db.from('albums').upsert(row, { onConflict: 'site,slug' }).select('id').single();
  if (error || !data) {
    console.log(`ALBOM XATO ${key}: ${error?.message}`);
    continue;
  }
  await db.from('album_items').delete().eq('album_id', data.id);
  const rows = items.map((it, i) => ({ album_id: data.id, kind: 'image', url: it.url, caption: it.caption, sort_order: i }));
  for (let i = 0; i < rows.length; i += 100) {
    const { error: e } = await db.from('album_items').insert(rows.slice(i, i + 100));
    if (e) console.log(`RASM XATO ${key}: ${e.message}`);
  }
  done++;
}
console.log(`Yozildi: ${done}/${list.length} albom.`);

// Avtomatik yaratilgan (slug = YYYY-MM) albomlardan, endi hech qanday rasmi qolmaganlarini o'chiramiz
const wanted = new Set(list.map(([k]) => k));
const existing = await fetchAll(db, 'albums', 'id,site,slug');
for (const a of existing) {
  if (/^\d{4}-\d{2}$/.test(a.slug) && !wanted.has(`${a.site}|${a.slug}`)) {
    await db.from('albums').delete().eq('id', a.id);
    console.log(`Keraksiz avto-albom o'chirildi: ${a.site}/${a.slug}`);
  }
}
