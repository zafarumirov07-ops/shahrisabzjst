/**
 * O'zbek lotin <-> kirill transliteratsiyasi (qoidaga asoslangan, tashqi xizmatsiz).
 * Faqat o'zbekcha matn uchun: ruscha matnni cyrToLat() ga bermang (hasLatinOzCyr tekshiradi).
 *
 * Bu modul hech narsani import qilmaydi (config.ts undan foydalanadi).
 */

const APOS = /[ʻʼ‘’`´']/;
const isApos = (c: string | undefined) => !!c && APOS.test(c);
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);
const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase();
const VOWELS_LAT = 'aeiouAEIOU';

function cased(out: string, upperFirst: boolean, upperRest = false): string {
  if (!upperFirst) return out;
  if (out.length === 1 || upperRest) return out.toUpperCase();
  return out[0].toUpperCase() + out.slice(1);
}

const LAT_SINGLE: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х', y: 'й', z: 'з',
};

/** Matn ichida o'zgarmasligi kerak qismlar: havolalar, email, HTML teglari */
const PROTECTED = /(\]\([^)\s]*\)|https?:\/\/[^\s)]+|www\.[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+|<[^>]+>)/g;

function latWord(src: string): string {
  let out = '';
  const n = src.length;
  for (let i = 0; i < n; i++) {
    const ch = src[i];
    const lo = ch.toLowerCase();
    const next = src[i + 1];
    const nextLo = next?.toLowerCase();
    const up = isUpper(ch);
    const prev = src[i - 1];
    const wordStart = !isLetter(prev) && !isApos(prev);

    // o' / g'  ->  ў / ғ
    if ((lo === 'o' || lo === 'g') && isApos(next)) {
      out += cased(lo === 'o' ? 'ў' : 'ғ', up);
      i += 1;
      continue;
    }
    // tutuq belgisi: unli + '  ->  ъ  (ma'lumot -> маълумот)
    if (isApos(ch)) {
      if (isLetter(prev) && /[a-zA-Z]/.test(prev) && isLetter(next)) out += 'ъ';
      else out += ch;
      continue;
    }
    // digraflar
    if (lo === 's' && nextLo === 'h') {
      out += cased('ш', up);
      i += 1;
      continue;
    }
    if (lo === 'c' && nextLo === 'h') {
      out += cased('ч', up);
      i += 1;
      continue;
    }
    if (lo === 'n' && nextLo === 'g') {
      out += cased('н', up) + cased('г', isUpper(next!) && up);
      i += 1;
      continue;
    }
    if (lo === 'y' && (nextLo === 'o' || nextLo === 'u' || nextLo === 'a' || nextLo === 'e')) {
      // yo' (yo'l) -> йў..., aks holda yo/yu/ya/ye -> ё/ю/я/е
      if (nextLo === 'o' && isApos(src[i + 2])) {
        out += cased('й', up);
        continue;
      }
      const map: Record<string, string> = { o: 'ё', u: 'ю', a: 'я', e: 'е' };
      out += cased(map[nextLo], up);
      i += 1;
      continue;
    }
    if (lo === 't' && nextLo === 's') {
      out += cased('ц', up);
      i += 1;
      continue;
    }
    if (lo === 'e') {
      out += cased(wordStart ? 'э' : 'е', up);
      continue;
    }
    if (lo in LAT_SINGLE) {
      out += cased(LAT_SINGLE[lo], up);
      continue;
    }
    out += ch;
  }
  return out;
}

/** O'zbek lotin -> kirill. Havolalar va emaillarga tegmaydi. */
export function latToCyr(text: string): string {
  if (!text) return text;
  return text
    .split(PROTECTED)
    .map((part, i) => (i % 2 === 1 ? part : latWord(part)))
    .join('');
}

const CYR_SINGLE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: "'", ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h', ё: 'yo',
};
const CYR_VOWELS = 'аеёиоуэюяыў';

/** O'zbek kirill -> lotin (ASCII apostrof bilan). */
export function cyrToLat(text: string): string {
  if (!text) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lo = ch.toLowerCase();
    const up = isUpper(ch);
    const prev = text[i - 1]?.toLowerCase();
    if (lo === 'е') {
      // so'z boshida yoki unlidan keyin "ye", boshqa joyda "e"
      const ye = !prev || !/\p{L}/u.test(prev) || CYR_VOWELS.includes(prev);
      out += cased(ye ? 'ye' : 'e', up);
      continue;
    }
    const m = CYR_SINGLE[lo];
    if (m !== undefined) {
      out += cased(m, up);
      continue;
    }
    out += ch;
  }
  return out;
}

/** Matn o'zbekcha kirillmi (ruscha emas)? Faqat ў қ ғ ҳ bo'yicha aniqlanadi. */
export function hasUzbekCyrillic(text: string): boolean {
  return /[ўқғҳЎҚҒҲ]/.test(text);
}

/** Matnda kirill harflar bormi (ruscha yoki o'zbekcha) */
export function hasCyrillic(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** Lug'at obyektidagi barcha satrlarni (chuqur) o'giradi */
export function mapDeep<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === 'string') return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => mapDeep(v, fn)) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapDeep(v, fn)])) as T;
  }
  return value;
}
