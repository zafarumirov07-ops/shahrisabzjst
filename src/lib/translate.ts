/**
 * Avtomatik tarjima (faqat serverda ishlaydi).
 *
 * Provayder TRANSLATE_PROVIDER env bilan tanlanadi:
 *   mymemory (standart, bepul; kunlik limit bor. MYMEMORY_EMAIL berilsa limit kattaroq bo'ladi)
 *   google   (GOOGLE_TRANSLATE_API_KEY kerak, Google Cloud Translation v2)
 *
 * Markdown tuzilishi saqlanadi: sarlavha/ro'yxat belgilari, rasm va havola manzillari o'zgarmaydi.
 * Kirill <-> lotin o'girish bu yerda emas (translit.ts, bepul va aniq).
 */

export type MtLang = 'uz' | 'ru' | 'en';

export class TranslateQuotaError extends Error {
  constructor(message = 'Tarjima xizmatining kunlik limiti tugadi') {
    super(message);
    this.name = 'TranslateQuotaError';
  }
}

const MM_CODE: Record<MtLang, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };
const MAX_CHUNK = 380; // MyMemory: bitta so'rovda ~500 bayt

const cache = new Map<string, string>();

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

async function mymemory(text: string, from: MtLang, to: MtLang): Promise<string> {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${MM_CODE[from]}|${MM_CODE[to]}`);
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set('de', process.env.MYMEMORY_EMAIL);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (res.status === 429) throw new TranslateQuotaError();
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const json = (await res.json()) as { responseData?: { translatedText?: string }; quotaFinished?: boolean; responseStatus?: number | string };
  const out = json.responseData?.translatedText ?? '';
  if (json.quotaFinished || /MYMEMORY WARNING/i.test(out) || Number(json.responseStatus) === 429) throw new TranslateQuotaError();
  if (Number(json.responseStatus) !== 200 || !out) throw new Error('MyMemory javob bermadi');
  return decodeEntities(out);
}

async function google(text: string, from: MtLang, to: MtLang): Promise<string> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY sozlanmagan');
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (res.status === 429 || res.status === 403) throw new TranslateQuotaError();
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { translations?: Array<{ translatedText?: string }> } };
  const out = json.data?.translations?.[0]?.translatedText;
  if (!out) throw new Error('Google javob bermadi');
  return decodeEntities(out);
}

async function rawTranslate(text: string, from: MtLang, to: MtLang): Promise<string> {
  const k = `${from}>${to}|${text}`;
  const hit = cache.get(k);
  if (hit !== undefined) return hit;
  const out = process.env.TRANSLATE_PROVIDER === 'google' ? await google(text, from, to) : await mymemory(text, from, to);
  if (cache.size > 2000) cache.clear();
  cache.set(k, out);
  return out;
}

/** Uzun abzacni gaplar bo'yicha MAX_CHUNK dan oshmaydigan bo'laklarga bo'ladi */
function splitSentences(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const parts = text.match(/[^.!?…]+[.!?…]+["»”’']*\s*|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > MAX_CHUNK && cur) {
      out.push(cur.trim());
      cur = '';
    }
    if (p.length > MAX_CHUNK) {
      // gap ham juda uzun bo'lsa so'zlar bo'yicha
      for (const w of p.split(/(?<=\s)/)) {
        if ((cur + w).length > MAX_CHUNK && cur) {
          out.push(cur.trim());
          cur = '';
        }
        cur += w;
      }
    } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function pool<T, R>(items: T[], size: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// Oxirgi ikki variant: muharrir himoyalagan qator boshi (\- , \# , 1\. ) ham tarjimaga kirmaydi
const LINE_PREFIX = /^(\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+|\\[-+#>=]+\s*|\d+\\[.)]\s+))/;
const SKIP_LINE = /^\s*(?:!\[[^\]]*\]\([^)]*\)\s*|https?:\/\/\S+\s*|[-*_]{3,}\s*|```.*)$/;

type Piece = { prefix: string; body: string; skip: boolean; tokens: string[] };

/** Havola manzillari va tayyor URL larni almashtirib qo'yadi (tarjimada buzilmasligi uchun) */
function protect(line: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  // Havola manzili, URL, e-pochta va himoyalangan belgilar (\* \_ \` ...) tarjimada o'zgarmaydi
  const text = line.replace(/\]\(([^)\s]+)\)|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+|\\[!-/:-@[-`{-~]/g, (m) => {
    tokens.push(m);
    return `[[${tokens.length - 1}]]`;
  });
  return { text, tokens };
}

function restore(text: string, tokens: string[]): string | null {
  let ok = true;
  const out = text.replace(/\[\s*\[\s*(\d+)\s*\]\s*\]/g, (_, n) => {
    const t = tokens[Number(n)];
    if (t === undefined) {
      ok = false;
      return '';
    }
    return t;
  });
  // hamma token qaytganini tekshiramiz
  for (let i = 0; i < tokens.length; i++) if (!new RegExp(`\\[\\s*\\[\\s*${i}\\s*\\]\\s*\\]`).test(text)) ok = false;
  return ok ? out : null;
}

/**
 * Matnni (oddiy yoki Markdown) tarjima qiladi. Bo'sh matn bo'sh qaytadi.
 * Xizmat limiti tugasa TranslateQuotaError tashlaydi.
 */
export async function translateMarkdown(text: string, from: MtLang, to: MtLang): Promise<string> {
  if (!text.trim() || from === to) return text;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const pieces: Piece[] = lines.map((line) => {
    if (!line.trim() || SKIP_LINE.test(line)) return { prefix: '', body: line, skip: true, tokens: [] };
    const m = line.match(LINE_PREFIX);
    const prefix = m ? m[1] : '';
    const { text: body, tokens } = protect(line.slice(prefix.length));
    return { prefix, body, skip: !/\p{L}/u.test(body), tokens };
  });

  // Tarjima qilinadigan bo'laklar ro'yxati
  const jobs: Array<{ line: number; part: number; text: string }> = [];
  const counts: number[] = [];
  pieces.forEach((p, line) => {
    if (p.skip) {
      counts[line] = 0;
      return;
    }
    const parts = splitSentences(p.body.trim());
    counts[line] = parts.length;
    parts.forEach((t, part) => jobs.push({ line, part, text: t }));
  });

  const results = await pool(jobs, 4, async (j) => rawTranslate(j.text, from, to));

  const byLine: string[][] = lines.map(() => []);
  jobs.forEach((j, i) => (byLine[j.line][j.part] = results[i]));

  return lines
    .map((line, i) => {
      const p = pieces[i];
      if (p.skip || !byLine[i].length) return line;
      const translated = byLine[i].join(' ').trim();
      const restored = restore(translated, p.tokens);
      if (restored === null) return line; // havolalar buzilgan: asl qatorni qoldiramiz
      return `${p.prefix}${restored}`;
    })
    .join('\n');
}

export function translationEnabled(): boolean {
  return process.env.TRANSLATE_PROVIDER !== 'off';
}
