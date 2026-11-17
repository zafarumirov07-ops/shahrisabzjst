// Tanlangan Telegram postlarini sayt formatiga o'tkazadi: sarlavha, matn (lotin), qisqa mazmun, slug, rasmlar.
// Ishlatish:  node scripts/tg-select.mjs   ->  tg excport/_selected.json  va  tg excport/_titles.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'tg excport');
const all = JSON.parse(fs.readFileSync(path.join(dir, '_parsed.json'), 'utf8'));

// _list.txt dagi tartib raqamlari (1 dan boshlab). Tanlov: texnikum hayoti, talabalar uchun e'lonlar, foydali ma'lumotlar.
const PICK = [
  // Texnikum hayoti va tadbirlari
  3, 32, 34, 69, 71, 72, 74, 78, 79, 83, 91, 100, 106, 107, 109, 113, 122, 127, 128, 130, 139, 142, 147, 155, 163,
  165, 199, 200, 203, 204, 214, 219, 222, 233, 234, 235,
  // Talabalar uchun e'lonlar
  8, 12, 15, 16, 18, 20, 21, 27, 28, 42, 44, 50, 53, 60, 62, 63, 73, 94, 96, 104, 108, 126, 133, 135, 149, 158,
  161, 182, 184, 194, 198,
  // Foydali ma'lumotlar (ta'lim, ish, tibbiyot, salomatlik)
  5, 7, 22, 31, 36, 40, 41, 43, 48, 52, 56, 82, 88, 110, 154, 174, 179, 185, 186, 189, 190, 191, 196, 201, 208, 211,
  212, 226, 227,
];

// Umumiy ("Barcha o'quvchilar diqqatiga!!!", "E'LON") yoki buzilgan sarlavhalar uchun qo'lda yozilgan sarlavhalar
const TITLES = {
  3: 'Bilimlar kuni: yangi o‘quv yili tantanali boshlandi',
  8: 'Bitiruvchilar diqqatiga: diplom muqovalari keltirildi',
  12: '2-3-kurs o‘quvchilari: darslarda to‘liq qatnashish so‘raladi',
  16: 'Elektron davomat jurnaliga kiritish boshlanadi',
  18: 'Abituriyentlar diqqatiga: hujjatlar qabuli davom etmoqda',
  20: 'Ijtimoiy reyestrdagi talaba-yoshlar diqqatiga',
  27: '“Zakovat” klubi a’zolari yig‘ilishga taklif etiladi',
  31: 'Germaniyada ishlash yoki o‘qish: kasblar ko‘rgazmasi',
  32: 'Jinoyatchilikning oldini olish bo‘yicha amaliy seminar',
  34: '“Mening raqamli huquqlarim” mavzusida interaktiv trening',
  42: 'Talabalar turar joyi Telegram kanaliga a’zo bo‘ling',
  43: 'Ta’lim krediti uchun my.gov.uz orqali ariza topshiring',
  44: 'Xona mudirlari va TTJ xodimlari diqqatiga: tozalik nazorati',
  50: 'Apk qo‘riqchisi ilovasi: telefoningizni himoya qiling',
  53: 'Texnikumlarda yozma imtihonlar o‘tkazildi: 2026/2027-o‘quv yili qabuli',
  128: '“Sharq ayoli ma’rifati” — oila va jamiyat ravnaqi yo‘lida',
  60: '1-kurs o‘quvchilari: o‘qish boshlanish kuni haqida',
  61: '“5 tashabbus” olimpiadasiga ro‘yxatdan o‘ting',
  62: '“5 tashabbus” saytida ro‘yxatdan o‘tish boshlandi',
  63: '“Sport ligasi”: voleybol va stol tennisi musobaqalari boshlanadi',
  69: '“Sport ligasi”: voleybol musobaqalari o‘tkazildi',
  71: '“Sport ligasi”: stol tennisi musobaqalari o‘tkazildi',
  72: '“Sport ligasi”: o‘quvchi-qizlar o‘rtasida voleybol o‘rtoqlik uchrashuvi',
  73: '“Bir oyda — bir kitob” loyihasi tadbiriga taklif',
  78: 'Ta’lim sifati va davomatni mustahkamlash: guruhlarda o‘rganish ishlari',
  79: '“Sport ligasi”: shaxmat-shashka musobaqalari o‘tkazildi',
  82: '“Gender tenglik faoli” milliy tanlovida ishtirok eting',
  83: 'Oila maskani: “Qizlarni turmushga tayyorlash” seminar-treningi',
  91: '“Bir oyda — bir kitob” loyihasi bo‘yicha tadbir o‘tkazildi',
  94: '1-kurs talabalari: 28-sentabr kuni o‘qish boshlanadi',
  96: 'Yotoqxonaga joylashish: 1-kurs talabalariga yo‘llanma beriladi',
  104: 'Ustozlar kuni: talabalar o‘qituvchilarini gullar bilan kutib oldi',
  106: 'Ustozlar kuni: “Ustoz — qalblarga yo‘l topgan buyuk zot” badiiy kechasi',
  107: 'Ustozlar kuni: o‘qituvchi Tursunova Masxuda ko‘krak nishoni bilan taqdirlandi',
  108: '1-oktabr — O‘qituvchi va murabbiylar kuni tabrigi',
  109: 'Profilaktik tadbirlar: huquqbuzarlik va jinoyatchilikning oldini olish',
  113: 'Profilaktik tadbirlar: kiberxavfsizlik bo‘yicha uchrashuv',
  126: 'Boshqa ta’lim muassasasiga ko‘chishni so‘ragan 2-3-kurs talabalari diqqatiga',
  127: 'Giyohvandlikka qarshi kurash bo‘yicha profilaktik tadbir',
  133: 'Xalqaro ta’lim dasturi o‘quvchilari diqqatiga: 10-oktabr kuni',
  135: 'Guruh sardorlari yig‘ilishi: 10-oktabr, soat 11:00',
  139: 'Texnikumda profilaktik suhbatlar o‘tkazildi',
  142: '“Zakovat” intellektual o‘yini o‘tkazildi',
  147: '“Besh tashabbus”: “Eng yaxshi kitobxon” tanlovi o‘tkazildi',
  149: 'Ogohlantirish: darslarni sababsiz qoldirmang',
  154: 'Tibbiyot xodimlari uchun 5 mingdan ortiq bo‘sh ish o‘rni e’lon qilingan',
  155: '18-oktabr — Shahrisabz shahri kuni',
  158: 'Diktant yozish tanloviga taklif',
  163: 'O‘zbek tili bayrami: Madaniyat saroyidagi tadbirda texnikum talabalari',
  165: 'O‘zbek tili bayrami munosabati bilan texnikumda ma’naviy-ma’rifiy tadbir',
  184: 'Yoshlar daftaridagi talabalar diqqatiga: ma’lumotnoma topshirish',
  189: 'Prezident tibbiyotga kirib kelayotgan yoshlarga ishonch bildirdi',
  191: 'Insonga xizmat qilgan har bir soha muqaddas, inson sog‘lig‘iga xizmat qilgan soha — ulug‘roq',
  194: 'Ogohlantirish: ichki tartib qoidalariga rioya qiling',
  196: 'Germaniyadan 45 ming mutaxassisga buyurtma kelib tushgan',
  199: 'Prezident Administratsiyasi rahbari Qashqadaryo ilg‘or kasbiy mahorat texnikumida',
  203: '“Tibbiyot xodimlari kuni” munosabati bilan bayram tadbiri',
  204: 'Qarshi shahrida ish o‘rinlari: ishga taklif etamiz',
  208: 'Ausbildung dasturiga ro‘yxatdan o‘tish davom etmoqda',
  214: 'Ijarada yashovchi talabalarning yashash sharoitlari o‘rganildi',
  222: '“Bir Vatan, bir el, bir bayroq!” — Vatan ramziga yuksak ehtirom',
  226: 'Texnikumlarda Yevropa mehnat bozori talablariga mos hamshiralar tayyorlanadi',
  227: 'Is gazi: undan saqlanishning 5 qoidasi',
};
// Matnni to'liq olish kerak bo'lgan postlar (sarlavha matn ichidan ajratilmaydi)
const BODY_FULL = new Set([18, 31, 53, 196, 226]);

// ---------- Kirill -> lotin (o'zbek) ----------
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '’',
  ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o‘', қ: 'q', ғ: 'g‘', ҳ: 'h', һ: 'h', е: 'e',
};
const CYR_VOWELS = 'аоуиэеёюяўы';
const isCyr = (c) => /[Ѐ-ӿ]/.test(c ?? '');

function translit(s) {
  let out = '';
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const low = ch.toLowerCase();
    if (!isCyr(ch) || !(low in MAP)) { out += ch; continue; }
    let r = MAP[low];
    if (low === 'е') {
      const prev = chars[i - 1]?.toLowerCase();
      if (!prev || (!isCyr(prev) && !/[a-z]/i.test(prev)) || CYR_VOWELS.includes(prev) || prev === 'ъ') r = 'ye';
    }
    if (ch !== low && r) {
      const nextUpper = chars[i + 1] && /\p{Lu}/u.test(chars[i + 1]);
      r = nextUpper && r.length > 1 ? r.toUpperCase() : r[0].toUpperCase() + r.slice(1);
    }
    out += r;
  }
  return out;
}

// "Turkcha" belgilar bilan yozilgan lotin matnlar (ş, ç, ö, ğ) -> o'zbek lotini
const TURK = { ş: 'sh', Ş: 'Sh', ç: 'ch', Ç: 'Ch', ö: 'o‘', Ö: 'O‘', ğ: 'g‘', Ğ: 'G‘', ı: 'i', ü: 'u', Ü: 'U' };
const fixTurk = (s) => s.replace(/[şŞçÇöÖğĞıüÜ]/g, (c) => TURK[c]);

/** URL va markdown havolalarga tegmasdan matn qismlariga funksiya qo'llaydi */
function outsideLinks(s, fn) {
  return s
    .split(/(\]\([^)]*\)|<https?:[^>]*>|https?:\/\/\S+)/g)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('');
}

function clean(line) {
  let t = translit(line);
  t = fixTurk(t);
  t = t.replace(/[“”«»]/g, '"').replace(/​/g, '').replace(/\[\s*\]\([^)]*\)/g, '');
  // Yopishib qolgan so'zlarni ajratish: "kuniAziz", "!Kelajagingiz", "o'tadiToshkent"
  t = t.replace(/\[([^\]]+)\]\(https?:\/\/t\.me\/[^)]*\)/g, '$1'); // Telegram havolalari matn sifatida qoladi
  t = outsideLinks(t, (p) =>
    p
      .replace(/(?<!Edu)(?<!You)(?<!My)([a-z])([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-z])([.!?])([A-Z][a-z])/g, '$1$2 $3'),
  );
  // Qalin (**) bo'laklar atrofida yopishib qolgan so'zlarni ajratish
  t = t.replace(/\*\*([^*\n]+?)\*\*/g, ' **$1** ').replace(/\s+([.,;:!?)”])/g, '$1').replace(/([(“])\s+/g, '$1');
  // Oxiridagi heshteglar
  t = t.replace(/(\s+#[\w‘’']+)+\s*$/g, '');
  // Juft bo'lmagan ** belgilarini olib tashlash
  if ((t.match(/\*\*/g) || []).length % 2 === 1) t = t.replace(/\*\*/g, '');
  return t.replace(/[ \t]+/g, ' ').trim();
}

const PROMO = [
  /obuna bo['‘’]?l/i, /kanalimizga/i, /kanalga qo['‘’]?shiling/i, /bizning (telegram|kanal|ijtimoiy|sahifa)/i,
  /bizni (kuzat|ijtimoiy)/i, /bizda siz uchun muhim/i, /^\[?(telegram|instagram|youtube|facebook)\]?(\(|$)/i,
  /^(#[\w‘’']+\s*)+$/, /^@\w+$/, /^https?:\/\/t\.me\/\S+$/i, /^<https?:\/\/t\.me\/\S+>$/i,
];

const PROPER = [
  [/shahrisabz/gi, 'Shahrisabz'], [/amir temur/gi, 'Amir Temur'], [/o‘zbekiston/gi, 'O‘zbekiston'], [/qashqadaryo/gi, 'Qashqadaryo'],
  [/prezident/gi, 'Prezident'], [/toshkent/gi, 'Toshkent'], [/qarshi/gi, 'Qarshi'], [/germaniya/gi, 'Germaniya'],
  [/abu ali ibn sino/gi, 'Abu Ali ibn Sino'], [/besh tashabbus/gi, 'Besh tashabbus'], [/zakovat/gi, 'Zakovat'], [/o‘zbek/gi, 'O‘zbek'],
];

function sentenceCase(s) {
  const letters = s.replace(/[^A-Za-z‘’]/g, '');
  const upper = letters.replace(/[^A-Z]/g, '').length;
  if (letters.length < 8 || upper / letters.length < 0.6) return s;
  let t = s.toLowerCase();
  t = t.replace(/(^|[.!?]\s+)([a-z‘’])/g, (_, a, b) => a + b.toUpperCase());
  t = t.charAt(0).toUpperCase() + t.slice(1);
  for (const [re, val] of PROPER) t = t.replace(re, val);
  return t;
}

/** Juft "" larni egri tirnoqqa (“ ”) aylantiradi; juft bo'lmasa boshiga ochuvchi qo'shadi */
function curly2(s) {
  const n = (s.match(/"/g) || []).length;
  if (n % 2 === 1) s = s.startsWith('"') ? s : `"${s}`;
  let toggle = false;
  return s.replace(/"/g, () => ((toggle = !toggle), toggle ? '“' : '”'));
}

// Matn boshidagi "E'LON!", "OGOHLANTIRISH", "Diqqat_e'lon!" kabi qoldiq prefikslar
const LEAD = /^(?:diqqat_?\s?e['’‘]?\s?lon!?|e['’‘]?\s?lon!?|ogohlantirish[.!]*|diqqat[!.]*)\s*/i;

function prepare(textRaw) {
  const text = textRaw.replace(/^(?:#[\w‘’']+\s*\|?\s*)+/, '');
  return text
    .split('\n')
    .map(clean)
    .filter(Boolean)
    .filter((l) => !PROMO.some((re) => re.test(l)))
    .filter((l) => !/^[!.*\s]+$/.test(l));
}

function derive(lines) {
  let title = '';
  let rest = [];
  const first = lines[0];
  const bold = first.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
  if (bold && bold[1].replace(/\*/g, '').trim().length >= 8) {
    title = bold[1];
    rest = [bold[2], ...lines.slice(1)].filter(Boolean);
  } else if (first.replace(/\*/g, '').length <= 110) {
    title = first;
    rest = lines.slice(1);
  } else {
    const m = first.replace(/\*\*/g, '').match(/^(.{25,125}?[.!?])\s+(.*)$/s);
    if (m) {
      title = m[1];
      rest = [m[2], ...lines.slice(1)].filter(Boolean);
    } else {
      const cut = first.replace(/\*\*/g, '').slice(0, 100);
      title = cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : 100).trim() + '…';
      rest = lines;
    }
  }
  title = sentenceCase(title.replace(/\*+/g, '').replace(/^[\s#–—-]+|[\s:;,]+$/g, '').replace(/\s+/g, ' ')).slice(0, 150);
  return { title, rest: rest.filter((l) => !/^[!.*\s_-]+$/.test(l)) };
}

const plain = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`<>]/g, '').replace(/\s+/g, ' ').trim();

function excerptOf(body, title) {
  const p = plain(body);
  const src = p === plain(title) ? '' : p;
  if (src.length <= 190) return src;
  const cut = src.slice(0, 190);
  return cut.slice(0, cut.lastIndexOf(' ')).trim() + '…';
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[ʻʼ'’‘`"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');

const used = new Set();
const selected = [];
for (const n of PICK) {
  const p = all[n - 1];
  if (!p) continue;
  const lines = prepare(p.text);
  if (lines.length === 0) continue;

  const auto = derive(lines);
  let { title, rest } = auto;
  if (TITLES[n]) title = TITLES[n];
  if (BODY_FULL.has(n)) {
    // Matn to'liq olinadi (faqat boshidagi katta harfli qoldiq olib tashlanadi)
    rest = lines.map((l) => l.replace(/^[A-Z‘’' ,.!?\-–—:]{8,}(?=[A-Z][a-z])/, '')).filter(Boolean);
  }
  if (/^\p{Ll}/u.test(title)) title = title.charAt(0).toUpperCase() + title.slice(1);

  rest = rest.map((l, i) => (i === 0 ? l.replace(LEAD, '') : l)).filter(Boolean);
  const body = rest.map((l) => curly2(sentenceCase(l))).filter(Boolean).join('\n\n') || title;
  title = curly2(title);

  let slug = slugify(title) || `post-${p.id}`;
  slug = `${slug}-${p.iso.slice(5, 10).replace('-', '')}`;
  while (used.has(slug)) slug += `-${p.id}`;
  used.add(slug);

  selected.push({ n, id: p.id, iso: p.iso, slug, title, body, excerpt: excerptOf(body, title), photos: p.photos });
}
selected.sort((a, b) => Date.parse(a.iso) - Date.parse(b.iso));
fs.writeFileSync(path.join(dir, '_selected.json'), JSON.stringify(selected, null, 1), 'utf8');
fs.writeFileSync(
  path.join(dir, '_titles.txt'),
  selected.map((s) => `${String(s.n).padStart(3, '0')}|${s.iso.slice(5, 10)}|f${s.photos.length}|${s.title}`).join('\n'),
  'utf8',
);
fs.writeFileSync(
  path.join(dir, '_bodies.txt'),
  selected.map((s) => `### ${String(s.n).padStart(3, '0')} ${s.title}\n${s.body.replace(/\n\n/g, ' / ').slice(0, 300)}\n`).join('\n'),
  'utf8',
);
console.log(`tanlandi: ${selected.length} ta post, rasmlar: ${selected.reduce((a, s) => a + s.photos.length, 0)} ta`);


