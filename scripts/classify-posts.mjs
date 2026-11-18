// Postlarni saralaydi: Ta'lim sifati / E'lon / Tadbir / Yangilik. Kalit so'zlar bo'yicha TAKLIF beradi,
// hech narsani avtomatik ko'chirmaydi: avval hisobot (manbalar/classification_review.tsv) ko'riladi va tuzatiladi.
//
// 1) node scripts/classify-posts.mjs                      taklif + hisobot (hech narsa yozilmaydi)
// 2) hisobotdagi "QAROR" ustunini tuzating:  site = main|talimsifati,  tur = news|announcement|event
//    (yoki:  --set slug=talimsifati/event,slug2=main/announcement ...  bilan chatdan)
// 3) node scripts/classify-posts.mjs --apply              qarorlarni bajaradi:
//      - site o'zgargan postlar talimsifati'ga ko'chiriladi
//      - tur = announcement  ->  posts.kind = 'announcement'
//      - tur = event         ->  events jadvaliga qator qo'shiladi, asl post qoralamaga (draft) o'tadi (o'chirilmaydi)
import fs from 'node:fs';
import path from 'node:path';
import { APPLY, fetchAll, getDb, opt, root } from './_lib.mjs';

const file = path.join(root, 'manbalar', 'classification_review.tsv');
fs.mkdirSync(path.dirname(file), { recursive: true });

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[ʻʼ‘’`´']/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ');

// ---- kalit so'zlar (apostrofsiz, kichik harfda) ----
const QUALITY = [
  ['talim sifat', 3], ['sifatini', 2], ['sifat', 1], ['sorovnoma', 2], ['manfaatdor tomon', 3], ['ichki taminlash', 3],
  ['akkreditatsiya', 3], ['attestatsiya', 2], ['monitoring', 2], ['talim dastur', 2], ['dasturini takomillashtir', 3],
  ['ish beruvchilar', 1], ['qoniqish', 1], ['baholash', 1], ['ozlashtirish', 1], ['hisoboti', 1], ['talim sifati', 3],
];
const ANNOUNCE = [
  ['elon', 3], ['diqqat', 2], ['royxatdan otish', 3], ['royxatdan otmoqda', 3], ['taklif etamiz', 2], ['ish orinlari', 3],
  ['vakansiya', 3], ['togarak', 2], ['hujjat topshir', 3], ['qabul davom', 3], ['ariza', 2], ['muddat', 1], ['ishga taklif', 3],
  ['bepul', 1], ['qabul boshlandi', 3], ['qabul e', 2], ['voucher', 1], ['grant', 1],
];
const EVENT = [
  ['otkazildi', 3], ['otkazilmoqda', 2], ['bolib otdi', 3], ['otdi', 1], ['tanlov', 2], ['uchrashuv', 2], ['bayram', 2],
  ['konferensiya', 3], ['seminar', 3], ['tadbir', 3], ['marosim', 3], ['festival', 3], ['musobaqa', 3], ['sport kuni', 3],
  ['karyera kuni', 3], ['ochiq eshiklar', 3], ['yigilish', 2], [' kuni', 1], ['davra suhbat', 3], ['debat', 3], ['aksiya', 2],
  ['treninglar', 1], ['trening', 2], ['mashgulot', 1], ['ekskursiya', 2], ['tashrif', 1], ['taqdirlandi', 2], ['taqdirlash', 2],
];

function score(text, list) {
  let n = 0;
  const hits = [];
  for (const [kw, w] of list) {
    if (text.includes(kw)) {
      n += w;
      hits.push(kw.trim());
    }
  }
  return { n, hits };
}

const db = getDb();
const posts = await fetchAll(db, 'posts', 'id,site,kind,slug,status,published_at,title,body,cover_url', (q) =>
  q.order('published_at', { ascending: false }),
);

const rows = posts.map((p) => {
  const title = fold(p.title?.uz);
  const body = fold((p.body?.uz ?? '').slice(0, 700));
  const t = `${title} ${title} ${body}`; // sarlavha 2x og'irlik
  const q = score(t, QUALITY);
  const a = score(t, ANNOUNCE);
  const e = score(t, EVENT);

  let site = p.site;
  if (p.site === 'main' && (q.n >= 5 || (title.includes('sifat') && q.n >= 3))) site = 'talimsifati';

  let type = p.kind === 'announcement' ? 'announcement' : 'news';
  const best = a.n >= e.n ? { t: 'announcement', s: a } : { t: 'event', s: e };
  if (best.s.n >= 4) type = best.t;
  // sifat postlari odatda yangilik bo'lib qoladi (tadbirga aylantirilmaydi)
  if (site === 'talimsifati' && type === 'event' && q.n >= 5) type = 'news';

  const reason = [q.n >= 3 ? `sifat(${q.n}):${q.hits.slice(0, 3).join('+')}` : '', a.n >= 3 ? `elon(${a.n}):${a.hits.slice(0, 3).join('+')}` : '', e.n >= 3 ? `tadbir(${e.n}):${e.hits.slice(0, 3).join('+')}` : '']
    .filter(Boolean)
    .join(' | ');
  return { p, suggestSite: site, suggestType: type, reason };
});

// ---- hisobot ----
const head = ['slug', 'sana', 'hozirgi', 'taklif (site/tur)', 'QAROR (site/tur)', 'sabab', 'sarlavha'].join('\t');
const body = rows
  .filter((r) => r.suggestSite !== r.p.site || r.suggestType !== (r.p.kind === 'announcement' ? 'announcement' : 'news') || true)
  .map((r) => {
    const cur = `${r.p.site}/${r.p.kind}`;
    const sug = `${r.suggestSite}/${r.suggestType}`;
    return [r.p.slug, String(r.p.published_at).slice(0, 10), cur, sug, sug, r.reason, r.p.title?.uz ?? ''].join('\t');
  });

// Avval saqlangan qarorlar (QAROR ustuni) o'qiladi
const decisions = new Map();
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n').slice(1)) {
    const c = line.split('\t');
    if (c.length >= 5 && c[0]) decisions.set(c[0], c[4].trim());
  }
}
for (const pair of opt('set', '').split(',').filter(Boolean)) {
  const [slug, val] = pair.split('=');
  if (slug && val) decisions.set(slug.trim(), val.trim());
}

if (!APPLY) {
  const merged = body.map((l) => {
    const c = l.split('\t');
    if (decisions.has(c[0])) c[4] = decisions.get(c[0]);
    return c.join('\t');
  });
  fs.writeFileSync(file, [head, ...merged].join('\n') + '\n');
  const cnt = {};
  for (const r of rows) {
    const k = `${r.suggestSite}/${r.suggestType}`;
    cnt[k] = (cnt[k] ?? 0) + 1;
  }
  console.log(`Postlar: ${rows.length}. Takliflar:`);
  console.table(cnt);
  console.log(`Hisobot: ${path.relative(root, file)}  (QAROR ustunini tuzatib, --apply bilan bajaring)`);
  process.exit(0);
}

// ================= APPLY =================
const probe = await db.from('events').select('slug').limit(1);
if (probe.error) {
  console.error('events.slug ustuni yo‘q: avval supabase/migrations/20261118000000_search_programs_events.sql ni SQL Editor’da ishga tushiring.');
  process.exit(1);
}

const MONTHS = { yanvar: 0, fevral: 1, mart: 2, aprel: 3, may: 4, iyun: 5, iyul: 6, avgust: 7, sentabr: 8, oktabr: 9, noyabr: 10, dekabr: 11 };
function eventDate(p) {
  const pub = new Date(p.published_at);
  const text = fold(`${p.title?.uz ?? ''} ${(p.body?.uz ?? '').slice(0, 500)}`);
  const m = text.match(/(\d{1,2})\s*-?\s*(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)/);
  if (m) {
    let d = new Date(Date.UTC(pub.getUTCFullYear(), MONTHS[m[2]], Number(m[1]), 5, 0, 0));
    if (d.getTime() - pub.getTime() > 45 * 86400000) d = new Date(Date.UTC(pub.getUTCFullYear() - 1, MONTHS[m[2]], Number(m[1]), 5, 0, 0));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return pub.toISOString();
}

const bySlug = new Map(rows.map((r) => [r.p.slug, r]));
let moved = 0, kinds = 0, events = 0;
for (const [slug, decision] of decisions) {
  const r = bySlug.get(slug);
  if (!r) continue;
  const [site, type] = decision.split('/');
  if (!['main', 'talimsifati'].includes(site) || !['news', 'announcement', 'event'].includes(type)) {
    console.log(`E'tibor bermadim (noto'g'ri qaror): ${slug} -> ${decision}`);
    continue;
  }
  const p = r.p;
  if (p.status === 'draft' && p.site === site && type === 'event') continue; // allaqachon tadbirga o'tkazilgan

  if (type === 'event') {
    const { data: media } = await db.from('post_media').select('url').eq('post_id', p.id).eq('kind', 'image').order('sort_order');
    const photos = [p.cover_url, ...(media ?? []).map((m) => m.url)].filter(Boolean);
    const description = { uz: [p.body?.uz ?? '', ...photos.map((u) => `![](${u})`)].filter(Boolean).join('\n\n') };
    const row = {
      site,
      slug: p.slug,
      title: p.title,
      description,
      location: {},
      starts_at: eventDate(p),
      cover_url: p.cover_url,
      published: true,
    };
    const { error } = await db.from('events').upsert(row, { onConflict: 'site,slug' });
    if (error) {
      console.log(`TADBIR XATO ${slug}: ${error.message}`);
      continue;
    }
    await db.from('posts').update({ status: 'draft' }).eq('id', p.id);
    events++;
    continue;
  }
  const patch = {};
  if (site !== p.site) patch.site = site;
  if (type !== p.kind) patch.kind = type;
  if (!Object.keys(patch).length) continue;
  const { error } = await db.from('posts').update(patch).eq('id', p.id);
  if (error) console.log(`POST XATO ${slug}: ${error.message}`);
  else {
    if (patch.site) moved++;
    if (patch.kind) kinds++;
  }
}
console.log(`Bajarildi: talimsifati'ga ko'chirildi ${moved}, e'lon qilindi ${kinds}, tadbirga o'tkazildi ${events}.`);
