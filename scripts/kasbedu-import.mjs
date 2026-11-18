// kasbedu.uz dagi texnikum postlarini ko'chiradi (ochiq API: api.kasbedu.uz, 1 ta so'rov + rasmlar).
//  - matn oddiy matndan Markdown ga, ` apostrof tuzatiladi, emoji olib tashlanadi, kirill post lotinga o'giriladi
//  - Telegram'dan allaqachon kelgan postlar (sarlavha + sana bo'yicha) o'tkazib yuboriladi va hisobotda ko'rsatiladi
//  - "Ta'lim sifati" postlari (QUALITY_IDS) talimsifati saytiga yoziladi
//  - rasmlar 1800px JPEG qilib siqiladi va Supabase Storage 'media/kasbedu/' ga yuklanadi
// Qayta ishga tushirish xavfsiz (slug va fayl yo'li bo'yicha yangilanadi).
//
// Ishlatish:  node scripts/kasbedu-import.mjs              (ko'rish, hisobot: manbalar/kasbedu/import_report.txt)
//             node scripts/kasbedu-import.mjs --apply      (yozish)
//             --refresh  API dan qayta yuklash     --quality-ids 1488,1489,...   --force-dup 1491  (dublikatni baribir yozish)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { APPLY, fetchAll, flag, getDb, opt, pool, root, sleep } from './_lib.mjs';
import { cyrToLat, hasCyrillic } from '../src/lib/i18n/translit.ts';
import { slugify } from '../src/lib/utils.ts';

const COLLEGE = 'shahrisabz-abu-ali-ibn-sino-nomidagi-jamoat-salomatligi-texnikumi';
const API = `https://api.kasbedu.uz/study/technical/${COLLEGE}/media/?page_size=100`;
const dir = path.join(root, 'manbalar', 'kasbedu');
fs.mkdirSync(path.join(dir, '_out'), { recursive: true });

const QUALITY_IDS = new Set(
  opt('quality-ids', '1488,1489,1490,1491,1492,1507')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter(Boolean),
);
const FORCE_DUP = new Set(opt('force-dup', '').split(',').map((x) => Number(x.trim())).filter(Boolean));

// ---------- 1) API dan o'qish ----------
const cacheFile = path.join(dir, '_kasbedu.json');
let items;
if (fs.existsSync(cacheFile) && !flag('refresh')) {
  items = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
} else {
  items = [];
  for (let url = API; url; ) {
    const res = await fetch(url, { headers: { 'User-Agent': 'shahrisabzjst-site-import' } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = await res.json();
    items.push(...json.results);
    url = json.next;
    await sleep(500);
  }
  fs.writeFileSync(cacheFile, JSON.stringify(items, null, 1));
}
console.log(`kasbedu.uz: ${items.length} ta post`);

// ---------- 2) Matnni tozalash ----------
const EMOJI = /[\p{Extended_Pictographic}️‍⃣]/gu;

/** Apostrof: o'/g' -> o‘ g‘ ; boshqa joyda ’ (mavjud Telegram postlari bilan bir xil) */
function fixApos(s) {
  return s
    .replace(/([oOgG])[`'ʻʼ´‘’](?=\p{L})/gu, '$1‘')
    .replace(/(\p{L})[`'ʻʼ´](?=\p{L})/gu, '$1’')
    .replace(/[`´]/g, '’');
}

function clean(text) {
  let t = String(text ?? '').replace(/\r\n/g, '\n').replace(/ /g, ' ').replace(EMOJI, '');
  if (hasCyrillic(t)) t = cyrToLat(t);
  t = fixApos(t)
    .replace(/(?<![\p{L}\p{N}])(?:\p{Lu} ){3,}\p{Lu}(?![\p{L}\p{N}])/gu, (m) => m.replace(/ /g, '')) // "H I S O B O T I" -> "HISOBOTI"
    .replace(/«([^»]*)»/g, '“$1”')
    .replace(/"([^"\n]+)"/g, '“$1”');
  return t;
}

function toMarkdown(text) {
  const t = clean(text);
  const out = [];
  for (const para of t.split(/\n{2,}/)) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const rendered = lines.map((l) => {
      const m = l.match(/^(?:[•●▪■◦·]|[-–—*]\s|\d+[.)]\s)\s*(.*)$/u);
      if (m && m[1]) return `- ${m[1]}`;
      return l;
    });
    out.push(rendered.some((l) => l.startsWith('- ')) ? rendered.join('\n') : rendered.join('  \n'));
  }
  return out.join('\n\n');
}

function excerptOf(md) {
  const first = md.split(/\n{2,}/).find((p) => !p.startsWith('- ') && !p.startsWith('#')) ?? '';
  const plain = first.replace(/\s+/g, ' ').replace(/[*_#>]/g, '').trim();
  if (plain.length <= 220) return plain;
  const cut = plain.slice(0, 220);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 120)).replace(/[,;:\s]+$/, '') + '…';
}

const norm = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/[ʻʼ‘’`´']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

function similarity(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

// ---------- 3) Bazadagi mavjud postlar bilan solishtirish ----------
const db = getDb();
const existing = await fetchAll(db, 'posts', 'id,site,slug,published_at,title');
const existingNorm = existing.map((p) => ({ ...p, words: norm(p.title?.uz ?? '') }));

const plan = items
  .slice()
  .sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)))
  .map((it) => {
    const title = clean(it.title).replace(/\s+/g, ' ').trim().replace(/\.$/, '');
    const body = toMarkdown(it.content);
    const date = String(it.publishedAt).slice(0, 10);
    const site = QUALITY_IDS.has(it.id) ? 'talimsifati' : 'main';
    const slug = `${slugify(title).slice(0, 60).replace(/-+$/, '')}-k${it.id}`;
    const words = norm(title);
    let best = { sim: 0, post: null };
    for (const p of existingNorm) {
      if (p.slug === slug) {
        best = { sim: 1, post: p, same: true };
        break;
      }
      const days = Math.abs((new Date(p.published_at) - new Date(date)) / 86400000);
      const sim = similarity(words, p.words);
      if (sim > best.sim && (days <= 10 || sim >= 0.8)) best = { sim, post: p };
    }
    const dup = !best.same && best.sim >= 0.6 && !FORCE_DUP.has(it.id);
    return { id: it.id, date, site, title, slug, body, excerpt: excerptOf(body), image: it.image, best, dup, hadCyr: hasCyrillic(String(it.title) + String(it.content)) };
  });

const lines = [];
for (const p of plan) {
  const status = p.best.same ? 'YANGILANADI (oldin yuklangan)' : p.dup ? `DUBLIKAT (${p.best.sim.toFixed(2)}) -> ${p.best.post.site}/${p.best.post.slug}` : p.best.sim >= 0.4 ? `yangi (o'xshash ${p.best.sim.toFixed(2)}: ${p.best.post.slug})` : 'yangi';
  lines.push(`${p.id}\t${p.date}\t${p.site}\t${status}\t${p.title}${p.hadCyr ? '  [kirilldan o‘girilgan]' : ''}${p.image ? '' : '  [rasmsiz]'}`);
}
fs.writeFileSync(path.join(dir, 'import_report.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
const toImport = plan.filter((p) => !p.dup);
console.log(`\nYoziladi: ${toImport.length}, dublikat: ${plan.length - toImport.length}, talimsifati: ${toImport.filter((p) => p.site === 'talimsifati').length}`);

if (!APPLY) {
  console.log('Dry-run: --apply bilan yoziladi.');
  process.exit(0);
}

// ---------- 4) Rasmlar ----------
const publicUrl = (p) => db.storage.from('media').getPublicUrl(p).data.publicUrl;
const urls = new Map();
const failed = [];
await pool(toImport.filter((p) => p.image), 3, async (p) => {
  const storagePath = `kasbedu/k${p.id}.jpg`;
  try {
    const res = await fetch(p.image, { headers: { 'User-Agent': 'shahrisabzjst-site-import' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());
    const buf = await sharp(input).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(dir, '_out', `k${p.id}.jpg`), buf);
    const { error } = await db.storage.from('media').upload(storagePath, buf, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
    if (error) throw new Error(error.message);
    const { error: mErr } = await db.from('media').upsert(
      { path: storagePath, url: publicUrl(storagePath), name: `kasbedu-${p.id}.jpg`, mime_type: 'image/jpeg', size_bytes: buf.length, kind: 'image' },
      { onConflict: 'path' },
    );
    if (mErr) throw new Error(mErr.message);
    urls.set(p.id, publicUrl(storagePath));
    await sleep(400);
  } catch (e) {
    failed.push(`${p.id}: ${e.message}`);
  }
});
console.log(`Rasmlar: ${urls.size} yuklandi, xato: ${failed.length}`);
if (failed.length) console.log(failed.join('\n'));

// ---------- 5) Postlar ----------
let created = 0;
for (const p of toImport) {
  const row = {
    site: p.site,
    kind: 'news',
    slug: p.slug,
    status: 'published',
    published_at: `${p.date}T09:00:00+05:00`,
    title: { uz: p.title },
    excerpt: p.excerpt ? { uz: p.excerpt } : {},
    body: { uz: p.body },
    cover_url: urls.get(p.id) ?? null,
    pinned: false,
  };
  const { error } = await db.from('posts').upsert(row, { onConflict: 'site,slug' });
  if (error) console.log(`POST XATO ${p.slug}: ${error.message}`);
  else created++;
}
console.log(`Postlar: ${created}/${toImport.length} yozildi.`);
