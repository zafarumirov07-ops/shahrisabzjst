// Aloqa (xarita koordinatalari) va Telegram havolasini ikkala saytning sozlamalariga qo'shadi.
// Mavjud qiymatlar saqlanadi (faqat shu kalitlar yangilanadi).
// Ishlatish:  node scripts/set-settings.mjs            (ko'rish)
//             node scripts/set-settings.mjs --apply    (yozish)
import { APPLY, getDb } from './_lib.mjs';

const MAP_URL = 'https://maps.app.goo.gl/XenJKKP6HubmUmRj8';
const LAT = '39.0346156';
const LNG = '66.8077641';
const TELEGRAM = 'https://t.me/shahrisabzjstex';

const db = getDb();
for (const site of ['main', 'talimsifati']) {
  const { data, error } = await db.from('site_settings').select('key,value').eq('site', site).in('key', ['contact', 'socials']);
  if (error) throw new Error(error.message);
  const cur = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? {}]));
  const contact = { ...(cur.contact ?? {}), map_url: MAP_URL, lat: LAT, lng: LNG };
  const socials = { ...(cur.socials ?? {}), telegram: TELEGRAM };
  console.log(site, 'contact keys ->', Object.keys(contact).join(', '), '| socials ->', Object.keys(socials).join(', '));
  if (!APPLY) continue;
  for (const [key, value] of [['contact', contact], ['socials', socials]]) {
    const { error: e } = await db.from('site_settings').upsert({ site, key, value }, { onConflict: 'site,key' });
    if (e) throw new Error(`${site}/${key}: ${e.message}`);
  }
}
console.log(APPLY ? 'Yozildi.' : 'Dry-run: --apply bilan yoziladi.');
