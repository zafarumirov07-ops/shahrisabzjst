// Telegram eksportini (tg excport/messages.html) postlarga ajratadi: matn, rasmlar, sana, reaksiyalar.
// Ishlatish:  node scripts/tg-parse.mjs   ->  tg excport/_parsed.json (git'ga tushmaydi)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'tg excport');
const html = fs.readFileSync(path.join(dir, 'messages.html'), 'utf8');

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };
const decode = (s) =>
  s.replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENT[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

// Emoji va piktogrammalar saytga o'tmaydi (loyiha qoidasi: emoji yo'q)
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{E0020}-\u{E007F}]/gu;

function toMarkdown(raw) {
  let s = raw;
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const t = text.replace(/<[^>]+>/g, '').trim();
    const h = decode(href);
    if (!/^https?:\/\//i.test(h)) return t;
    return t === h || !t ? `<${h}>` : `[${t}](${h})`;
  });
  s = s.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, _t, x) => (x.trim() ? `**${x.trim()}** ` : ''));
  s = s.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_, _t, x) => (x.trim() ? `*${x.trim()}* ` : ''));
  s = s.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  s = s.replace(/<[^>]+>/g, '');
  s = decode(s).replace(EMOJI, '');
  s = s
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s;
}

const parts = html.split(/<div class="message (?=default)/).slice(1);
const msgs = [];
for (const p of parts) {
  const id = Number((p.match(/id="message(\d+)"/) || [])[1]);
  const dm = p.match(/title="(\d\d)\.(\d\d)\.(\d{4}) (\d\d):(\d\d):(\d\d) GMT([+-]\d\d):(\d\d)"/);
  if (!id || !dm) continue;
  const [, dd, mo, yy, hh, mi, ss, tzh, tzm] = dm;
  const iso = `${yy}-${mo}-${dd}T${hh}:${mi}:${ss}${tzh}:${tzm}`;
  const textMatch = p.match(/<div class="text">([\s\S]*?)<\/div>\s*(?:<span class="reactions"|<div class="signature|<\/div>|<div class="reply)/);
  const text = textMatch ? toMarkdown(textMatch[1]) : '';
  const photos = [...p.matchAll(/<a class="photo_wrap[^"]*" href="(photos\/[^"]+)"/g)].map((m) => decode(m[1]));
  const files = [...p.matchAll(/<a class="media_file[^"]*"[^>]*href="(files\/[^"]+)"/g)].map((m) => decode(m[1]));
  const videoMissing = /media_video|Video file|video_file/.test(p) && !/video_files\//.test(p);
  const forwarded = /forwarded body/.test(p);
  const reactions = [...p.matchAll(/<span class="count">\s*(\d+)\s*<\/span>/g)].reduce((a, m) => a + Number(m[1]), 0);
  msgs.push({ id, iso, t: Date.parse(iso), text, photos, files, videoMissing, forwarded, reactions });
}

// Albomlar: bir necha soniya ichida ketma-ket kelgan rasmli xabarlar bitta post
const posts = [];
for (const m of msgs) {
  const last = posts[posts.length - 1];
  const lastMsg = last?.msgs[last.msgs.length - 1];
  const sameAlbum = last && lastMsg && m.t - lastMsg.t <= 3000 && m.photos.length > 0 && last.photos.length > 0;
  if (sameAlbum) {
    last.msgs.push(m);
    last.photos.push(...m.photos);
    last.files.push(...m.files);
    if (m.text) last.text = last.text ? `${last.text}\n\n${m.text}` : m.text;
    last.reactions += m.reactions;
    last.videoMissing ||= m.videoMissing;
  } else {
    posts.push({ id: m.id, iso: m.iso, text: m.text, photos: [...m.photos], files: [...m.files], videoMissing: m.videoMissing, forwarded: m.forwarded, reactions: m.reactions, msgs: [m] });
  }
}
const out = posts.map(({ msgs: _m, ...rest }) => rest);
fs.writeFileSync(path.join(dir, '_parsed.json'), JSON.stringify(out, null, 1), 'utf8');

const withText = out.filter((p) => p.text.length > 0);
console.log(`xabarlar: ${msgs.length}  postlar (albom birlashtirilgan): ${out.length}`);
console.log(`matnli: ${withText.length}  rasmli: ${out.filter((p) => p.photos.length).length}  matn>=250 belgi: ${out.filter((p) => p.text.length >= 250).length}`);
console.log(`sanalar: ${out[0].iso.slice(0, 10)} ... ${out[out.length - 1].iso.slice(0, 10)}`);
console.log(`fayl biriktirilgan: ${out.filter((p) => p.files.length).length}  videosi yo'q (eksportda yo'q): ${out.filter((p) => p.videoMissing).length}`);
