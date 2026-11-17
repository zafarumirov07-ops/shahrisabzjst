// supabase/seed/kasbedu.json  ->  supabase/seed/kasbedu_import.sql
// Ishlatish:  node scripts/build-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'supabase/seed/kasbedu.json'), 'utf8'));

const q = (v) => (v === undefined || v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const j = (o) => `${q(JSON.stringify(o ?? {}))}::jsonb`;
const ts = (v) => (v ? `${q(v)}::timestamptz` : 'now()');

const out = [];
out.push('-- Eski saytdan (kasbedu.uz) ko‘chirilgan ma‘lumotlar. Avtomatik yaratilgan: node scripts/build-seed.mjs');
out.push('-- Qayta ishga tushirish xavfsiz: yozuvlar slug / kalit bo‘yicha yangilanadi.');
out.push('begin;');

// Sozlamalar
for (const [site, keys] of Object.entries(data.settings)) {
  for (const [key, value] of Object.entries(keys)) {
    out.push(
      `insert into public.site_settings (site, key, value) values (${q(site)}, ${q(key)}, ${j(value)})\n` +
        `  on conflict (site, key) do update set value = excluded.value;`,
    );
  }
}

// Sahifalar
for (const p of data.pages) {
  out.push(
    `insert into public.pages (site, slug, title, body, published, sort_order)\n` +
      `  values (${q(p.site)}, ${q(p.slug)}, ${j(p.title)}, ${j(p.body)}, true, ${Number(p.sort_order ?? 0)})\n` +
      `  on conflict (site, slug) do update set title = excluded.title, body = excluded.body, sort_order = excluded.sort_order;`,
  );
}

// Yo'nalishlar
for (const p of data.programs) {
  const description = p.description ?? data.programDefaults.description;
  const duration = p.duration ?? data.programDefaults.duration;
  out.push(
    `insert into public.programs (slug, name, description, duration, published, sort_order)\n` +
      `  values (${q(p.slug)}, ${j(p.name)}, ${j(description)}, ${j(duration)}, true, ${Number(p.sort_order ?? 0)})\n` +
      `  on conflict (slug) do update set name = excluded.name, description = excluded.description,\n` +
      `    duration = excluded.duration, sort_order = excluded.sort_order;`,
  );
}

// Postlar
for (const p of data.posts) {
  out.push(
    `insert into public.posts (site, kind, slug, status, published_at, title, excerpt, body, cover_url)\n` +
      `  values (${q(p.site)}, ${q(p.kind)}, ${q(p.slug)}, 'published', ${ts(p.published_at)}, ${j(p.title)}, ${j(p.excerpt)}, ${j(p.body)}, ${q(p.cover_url)})\n` +
      `  on conflict (site, slug) do update set kind = excluded.kind, status = 'published', published_at = excluded.published_at,\n` +
      `    title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_url = excluded.cover_url;`,
  );
}

// Albomlar (elementlari bilan)
for (const a of data.albums) {
  const items = a.items
    .map(
      (it, i) =>
        `    insert into public.album_items (album_id, kind, url, caption, sort_order) values (a_id, ${q(it.kind)}, ${q(it.url)}, ${q(it.caption)}, ${i});`,
    )
    .join('\n');
  out.push(
    `do $$\ndeclare a_id uuid;\nbegin\n` +
      `  insert into public.albums (site, slug, title, description, cover_url, published, published_at)\n` +
      `    values (${q(a.site)}, ${q(a.slug)}, ${j(a.title)}, ${j(a.description)}, ${q(a.cover_url)}, true, ${ts(a.published_at)})\n` +
      `    on conflict (site, slug) do update set title = excluded.title, description = excluded.description,\n` +
      `      cover_url = excluded.cover_url, published_at = excluded.published_at\n` +
      `    returning id into a_id;\n` +
      `  delete from public.album_items where album_id = a_id;\n${items}\nend $$;`,
  );
}

out.push('commit;');
const file = path.join(root, 'supabase/seed/kasbedu_import.sql');
fs.writeFileSync(file, out.join('\n\n') + '\n', 'utf8');
console.log(`Yozildi: ${path.relative(root, file)} (${out.length - 2} ta buyruq)`);
