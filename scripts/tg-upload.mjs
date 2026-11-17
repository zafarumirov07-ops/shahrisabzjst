// Tanlangan Telegram postlarini Supabase'ga joylaydi: rasmlar (Storage 'media' bucket + media jadvali) va postlar.
// Qayta ishga tushirish xavfsiz: fayllar yo'l bo'yicha, postlar slug bo'yicha yangilanadi.
// Ishlatish:  node scripts/tg-upload.mjs        (.env.local dagi SUPABASE_SECRET_KEY kerak)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'tg excport');
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const selected = JSON.parse(fs.readFileSync(path.join(dir, '_selected.json'), 'utf8'));
const publicUrl = (p) => db.storage.from('media').getPublicUrl(p).data.publicUrl;

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

// 1) Rasmlarni yuklash
const jobs = [];
for (const p of selected) {
  p.photos.forEach((_, i) => jobs.push({ post: p, i: i + 1 }));
}
let uploaded = 0;
const failed = [];
await pool(jobs, 5, async ({ post, i }) => {
  const file = path.join(dir, '_out', `${post.id}-${i}.jpg`);
  const storagePath = `telegram/${post.id}-${i}.jpg`;
  const buf = fs.readFileSync(file);
  const { error } = await db.storage.from('media').upload(storagePath, buf, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
  if (error) {
    failed.push(`${storagePath}: ${error.message}`);
    return;
  }
  const { error: mErr } = await db.from('media').upsert(
    {
      path: storagePath,
      url: publicUrl(storagePath),
      name: `telegram-${post.id}-${i}.jpg`,
      mime_type: 'image/jpeg',
      size_bytes: buf.length,
      kind: 'image',
    },
    { onConflict: 'path' },
  );
  if (mErr) failed.push(`media ${storagePath}: ${mErr.message}`);
  uploaded++;
  if (uploaded % 40 === 0) console.log(`  yuklandi: ${uploaded}/${jobs.length}`);
});
console.log(`Rasmlar: ${uploaded}/${jobs.length} yuklandi, xato: ${failed.length}`);
if (failed.length) console.log(failed.slice(0, 10).join('\n'));

// 2) Postlarni joylash
let created = 0;
for (const p of selected) {
  const photoPaths = p.photos.map((_, i) => `telegram/${p.id}-${i + 1}.jpg`);
  const row = {
    site: 'main',
    kind: 'news',
    slug: p.slug,
    status: 'published',
    published_at: p.iso,
    title: { uz: p.title },
    excerpt: p.excerpt ? { uz: p.excerpt } : {},
    body: { uz: p.body },
    cover_url: photoPaths[0] ? publicUrl(photoPaths[0]) : null,
    pinned: false,
  };
  const { data, error } = await db.from('posts').upsert(row, { onConflict: 'site,slug' }).select('id').single();
  if (error || !data) {
    console.log(`POST XATO ${p.slug}: ${error?.message}`);
    continue;
  }
  // Qolgan rasmlar post galereyasiga (birinchisi muqova bo'ldi)
  await db.from('post_media').delete().eq('post_id', data.id);
  const extra = photoPaths.slice(1).map((pp, i) => ({ post_id: data.id, kind: 'image', url: publicUrl(pp), title: null, sort_order: i }));
  if (extra.length) {
    const { error: eErr } = await db.from('post_media').insert(extra);
    if (eErr) console.log(`GALEREYA XATO ${p.slug}: ${eErr.message}`);
  }
  created++;
}
console.log(`Postlar: ${created}/${selected.length} joylandi`);
