/**
 * Vizual muharrir (RichEditor) uchun Markdown <-> HTML o'giruvchi.
 *
 * Saqlash formati Markdown bo'lib qoladi (tarjima, qidiruv va sayt shu formatga tayanadi), lekin
 * muharrirda foydalanuvchi belgilarni ko'rmaydi. Yozilgan `, -, ", *, #, > kabi belgilar matn
 * sifatida qoladi: saqlashda zarur joyda `\` bilan himoyalanadi va saytda aynan shunday chiqadi.
 *
 * Qo'llab-quvvatlanadigan tuzilma: abzatslar/qator uzilishlari, **qalin**, *qiya*, ## sarlavha,
 * - va 1. ro'yxatlar, [havola](url), ![rasm](url), ---.
 */

const PUNCT = /[!-/:-@[-`{-~]/; // ASCII tinish belgilari (Markdown'da `\` bilan himoyalanishi mumkin)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = (u: string) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u.trim());
const safeImg = (u: string) => /^(https?:\/\/|\/)/i.test(u.trim());

/* ------------------------------------------------------------------ */
/* Markdown -> HTML                                                    */
/* ------------------------------------------------------------------ */

/** `mark` ning yopuvchi o'rnini topadi (`\` bilan himoyalangan belgilar va ichki ** juftliklari o'tkazib yuboriladi) */
function findClose(s: string, from: number, mark: string): number {
  let k = from;
  while (k < s.length) {
    if (s[k] === '\\') {
      k += 2;
      continue;
    }
    if (mark === '*' && s.startsWith('**', k)) {
      const e = findClose(s, k + 2, '**');
      if (e < 0) {
        k += 2;
        continue;
      }
      k = e + 2;
      continue;
    }
    if (s.startsWith(mark, k)) return k;
    k++;
  }
  return -1;
}

const IMG_RE = /^!\[([^\]]*)\]\(\s*([^)\s]*)(?:\s+"[^"]*")?\s*\)/;
const LINK_RE = /^\[((?:\\.|[^\]\\])*)\]\(\s*([^)\s]*)(?:\s+"[^"]*")?\s*\)/;

function inlineToHtml(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];

    if (c === '\\' && i + 1 < s.length && PUNCT.test(s[i + 1])) {
      out += esc(s[i + 1]);
      i += 2;
      continue;
    }

    if (c === '!') {
      const m = IMG_RE.exec(s.slice(i));
      if (m) {
        out += safeImg(m[2]) ? `<img src="${esc(m[2])}" alt="${esc(m[1])}">` : '';
        i += m[0].length;
        continue;
      }
    }

    if (c === '[') {
      const m = LINK_RE.exec(s.slice(i));
      if (m) {
        const inner = inlineToHtml(m[1]);
        out += safeUrl(m[2]) ? `<a href="${esc(m[2])}">${inner}</a>` : inner;
        i += m[0].length;
        continue;
      }
    }

    if (c === '*') {
      if (s.startsWith('***', i)) {
        const j = findClose(s, i + 3, '***');
        if (j > i + 3) {
          out += `<b><i>${inlineToHtml(s.slice(i + 3, j))}</i></b>`;
          i = j + 3;
          continue;
        }
      }
      if (s.startsWith('**', i)) {
        const j = findClose(s, i + 2, '**');
        if (j > i + 2 && !/^\s/.test(s.slice(i + 2, j))) {
          out += `<b>${inlineToHtml(s.slice(i + 2, j))}</b>`;
          i = j + 2;
          continue;
        }
      } else if (!/\s/.test(s[i + 1] ?? ' ')) {
        const j = findClose(s, i + 1, '*');
        if (j > i + 1) {
          out += `<i>${inlineToHtml(s.slice(i + 1, j))}</i>`;
          i = j + 1;
          continue;
        }
      }
    }

    if (c === '_' && !/\w/.test(s[i - 1] ?? ' ') && !/\s/.test(s[i + 1] ?? ' ')) {
      const j = findClose(s, i + 1, '_');
      if (j > i + 1 && !/\w/.test(s[j + 1] ?? ' ')) {
        out += `<i>${inlineToHtml(s.slice(i + 1, j))}</i>`;
        i = j + 1;
        continue;
      }
    }

    out += esc(c);
    i++;
  }
  return out;
}

const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const UL = /^\s{0,3}[-*+]\s+(.*)$/;
const OL = /^\s{0,3}\d+[.)]\s+(.*)$/;
const IMG_LINE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/;

const isBlockStart = (l: string) => HEADING.test(l) || HR.test(l) || UL.test(l) || OL.test(l) || IMG_LINE.test(l);

/** Markdown matnni muharrir uchun HTML ga o'giradi */
export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let prevPara = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    let m: RegExpExecArray | null;
    if ((m = HEADING.exec(line))) {
      out.push(`<${m[1].length <= 2 ? 'h2' : 'h3'}>${inlineToHtml(m[2])}</${m[1].length <= 2 ? 'h2' : 'h3'}>`);
      prevPara = false;
      i++;
    } else if (IMG_LINE.test(line)) {
      out.push(`<div>${inlineToHtml(line.trim())}</div>`);
      prevPara = false;
      i++;
    } else if (HR.test(line)) {
      out.push('<hr>');
      prevPara = false;
      i++;
    } else if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line) && !UL.test(line);
      const start = ordered ? Number(/^\s*(\d+)/.exec(line)![1]) : 1; // "2." bilan boshlangan ro'yxat raqami saqlanadi
      const items: string[] = [];
      while (i < lines.length && (ordered ? OL : UL).test(lines[i])) {
        items.push(`<li>${inlineToHtml((ordered ? OL : UL).exec(lines[i])![1])}</li>`);
        i++;
      }
      const open = ordered ? (start > 1 ? `ol start="${start}"` : 'ol') : 'ul';
      out.push(`<${open}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      prevPara = false;
    } else {
      if (prevPara) out.push('<div><br></div>');
      let first = true;
      while (i < lines.length && lines[i].trim() && (first || !isBlockStart(lines[i]))) {
        out.push(`<div>${inlineToHtml(lines[i].trim())}</div>`);
        first = false;
        i++;
      }
      prevPara = true;
    }
  }
  return out.join('');
}

/** Muharrirda vizual ko'rsatib bo'lmaydigan murakkab Markdown (jadval, kod, iqtibos, ichma-ich ro'yxat, HTML) */
export function needsRaw(md: string): boolean {
  return /^\s*(```|~~~)|^\s*>|^\s*\|.*\|\s*$|(?<!\\)<\/?[a-z][^>]*>|^\s{2,}[-*+]\s|^\s{0,3}\d+[.)]\s.*\n\s{2,}\S|^\[[^\]]+\]:\s/m.test(md);
}

/* ------------------------------------------------------------------ */
/* HTML (DOM) -> Markdown                                              */
/* ------------------------------------------------------------------ */

const BLOCK = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'IMG', 'HR', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TBODY', 'TR']);
const isBlock = (n: Node) => n.nodeType === 1 && BLOCK.has((n as Element).tagName);

function escPlain(s: string): string {
  return s
    .replace(/[\\`*[\]<~]/g, '\\$&')
    // so'z ichidagi _ (snake_case) himoyasiz qoladi, qolgani himoyalanadi
    .replace(/_/g, (m, off: number, str: string) =>
      /[\p{L}\p{N}]/u.test(str[off - 1] ?? '') && /[\p{L}\p{N}]/u.test(str[off + 1] ?? '') ? m : '\\_',
    )
    .replace(/&(?=#?[a-zA-Z0-9]+;)/g, '\\&');
}

/** Oddiy matndagi Markdown belgilarini himoyalaydi (havola manzillari tegilmaydi) */
function escapeText(t: string): string {
  return t
    .split(/((?:https?:\/\/|www\.)\S+)/)
    .map((part, idx) => (idx % 2 ? part : escPlain(part)))
    .join('');
}

/** Qator boshidagi `#`, `-`, `1.`, `>` kabilar ro'yxat/sarlavhaga aylanib ketmasligi uchun */
function escapeLineStart(l: string): string {
  return l
    .replace(/^(#{1,6})(\s|$)/, '\\$1$2')
    .replace(/^>/, '\\>')
    .replace(/^([-+])(\s|$)/, '\\$1$2')
    .replace(/^(\d+)([.)])(\s|$)/, '$1\\$2$3')
    .replace(/^([-=])(?=[-=]*\s*$)/, '\\$1');
}

function boldOf(el: HTMLElement): boolean {
  const fw = el.style?.fontWeight;
  if (fw) return fw === 'bold' || fw === 'bolder' || Number(fw) >= 600;
  return el.tagName === 'B' || el.tagName === 'STRONG';
}

function italicOf(el: HTMLElement): boolean {
  const fs = el.style?.fontStyle;
  if (fs) return fs === 'italic' || fs === 'oblique';
  return el.tagName === 'I' || el.tagName === 'EM' || el.tagName === 'CITE';
}

/** Belgilarni bo'shliqlardan tashqariga chiqarib, har bir qator uchun alohida o'raydi */
function wrapMarks(inner: string, bold: boolean, italic: boolean): string {
  if (!bold && !italic) return inner;
  const mark = bold && italic ? '***' : bold ? '**' : '*';
  return inner
    .split('\n')
    .map((seg) => {
      const core = seg.trim();
      if (!core) return seg;
      const lead = seg.slice(0, seg.indexOf(core));
      const trail = seg.slice(lead.length + core.length);
      return `${lead}${mark}${core}${mark}${trail}`;
    })
    .join('\n');
}

type Ctx = { bold: boolean; italic: boolean };

function linkDest(href: string): string {
  return href.trim().replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function inlineList(nodes: Node[], ctx: Ctx): string {
  let out = '';
  for (const n of nodes) {
    if (n.nodeType === 3) {
      out += escapeText((n.nodeValue ?? '').replace(/[\s ]+/g, ' '));
      continue;
    }
    if (n.nodeType !== 1) continue;
    const el = n as HTMLElement;
    switch (el.tagName) {
      case 'BR':
        out += '\n';
        break;
      case 'IMG': {
        const src = el.getAttribute('src') ?? '';
        if (safeImg(src)) out += `![${(el.getAttribute('alt') ?? '').replace(/[[\]\n]/g, ' ')}](${linkDest(src)})`;
        break;
      }
      case 'A': {
        const inner = inlineList(Array.from(el.childNodes), ctx);
        const href = el.getAttribute('href') ?? '';
        out += inner.trim() && safeUrl(href) ? `[${inner.replace(/\n/g, ' ')}](${linkDest(href)})` : inner;
        break;
      }
      case 'SCRIPT':
      case 'STYLE':
        break;
      default: {
        const b = boldOf(el) && !ctx.bold;
        const i = italicOf(el) && !ctx.italic;
        const inner = inlineList(Array.from(el.childNodes), { bold: ctx.bold || b, italic: ctx.italic || i });
        out += wrapMarks(inner, b, i);
      }
    }
  }
  return out.replace(/\*{6}/g, '').replace(/\*{4}/g, '');
}

type State = { out: string[]; para: string[]; loose: Node[] };

function flushPara(st: State) {
  if (st.para.length) st.out.push(st.para.join('\n'));
  st.para = [];
}

function addText(st: State, text: string) {
  for (const seg of text.split('\n')) {
    const t = seg.trim();
    if (!t) flushPara(st);
    else st.para.push(escapeLineStart(t));
  }
}

function flushLoose(st: State) {
  if (!st.loose.length) return;
  const text = inlineList(st.loose, { bold: false, italic: false });
  st.loose = [];
  addText(st, text);
}

function listItems(list: Element): string[] {
  const items: string[] = [];
  for (const li of Array.from(list.children)) {
    if (li.tagName !== 'LI') continue;
    const inline = Array.from(li.childNodes).filter((n) => !(n.nodeType === 1 && /^(UL|OL)$/.test((n as Element).tagName)));
    const text = inlineList(inline, { bold: false, italic: false }).replace(/\s*\n\s*/g, ' ').trim();
    if (text) items.push(text);
    for (const sub of Array.from(li.children)) if (/^(UL|OL)$/.test(sub.tagName)) items.push(...listItems(sub));
  }
  return items;
}

const BLOCK_SELECTOR = Array.from(BLOCK).join(',').toLowerCase();

function walk(container: Node, st: State) {
  for (const n of Array.from(container.childNodes)) {
    if (!isBlock(n)) {
      // Abzatslarni o'rab turgan oddiy teg (masalan Google Docs'dagi <b>) — shaffof deb olinadi
      if (n.nodeType === 1 && (n as Element).querySelector(BLOCK_SELECTOR)) {
        flushLoose(st);
        walk(n, st);
      } else st.loose.push(n);
      continue;
    }
    flushLoose(st);
    const el = n as HTMLElement;
    const tag = el.tagName;

    if (tag === 'DIV' || tag === 'P') {
      if (Array.from(el.childNodes).some(isBlock)) walk(el, st);
      else {
        const text = inlineList(Array.from(el.childNodes), { bold: false, italic: false }).replace(/\n$/, '');
        addText(st, text);
      }
      if (tag === 'P') flushPara(st);
    } else if (/^H[1-6]$/.test(tag)) {
      flushPara(st);
      const text = inlineList(Array.from(el.childNodes), { bold: true, italic: false }).replace(/\s*\n\s*/g, ' ').trim();
      if (text) st.out.push(`${Number(tag[1]) <= 2 ? '##' : '###'} ${text}`);
    } else if (tag === 'UL' || tag === 'OL') {
      flushPara(st);
      const items = listItems(el).map((t) => escapeLineStart(t));
      const first = tag === 'OL' ? Math.max(1, parseInt(el.getAttribute('start') ?? '1', 10) || 1) : 1;
      if (items.length) st.out.push(items.map((t, k) => `${tag === 'OL' ? `${first + k}. ` : '- '}${t}`).join('\n'));
    } else if (tag === 'IMG') {
      flushPara(st);
      const src = el.getAttribute('src') ?? '';
      if (safeImg(src)) st.out.push(`![${(el.getAttribute('alt') ?? '').replace(/[[\]\n]/g, ' ')}](${linkDest(src)})`);
    } else if (tag === 'HR') {
      flushPara(st);
      st.out.push('---');
    } else {
      walk(el, st);
    }
  }
  flushLoose(st);
}

/** Muharrir DOM'ini (yoki joylangan HTML'ni) Markdown ga o'giradi */
export function htmlToMd(root: Node): string {
  const st: State = { out: [], para: [], loose: [] };
  walk(root, st);
  flushPara(st);
  return st.out.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Avtomatik tartiblash ("Tartiblash" tugmasi)                         */
/* ------------------------------------------------------------------ */

/** Bir qatordagi matnni tozalaydi: bo'shliqlar, tinish belgilari, apostrof va tirnoq */
function tidyLine(l: string, lang: string): string {
  let s = l.replace(/[ \t ]+/g, ' ').trim();
  if (!s || /https?:\/\/|www\./.test(s)) return s;
  if (lang === 'uz') {
    s = s
      .replace(/([oOgG])[’‘'`ʼʻ´]/g, '$1‘') // o‘ g‘
      .replace(/(\p{L})[’'`ʼʻ´](?=\p{L})/gu, '$1’'); // tutuq belgisi: ta’lim
  }
  if (lang === 'uz' || lang === 'en') s = s.replace(/"([^"\n]{1,300})"/g, '“$1”');
  return s
    .replace(/\s+([,;:!?])/g, '$1')
    .replace(/\s+\.(?!\.)/g, '.')
    .replace(/([,;])(?=\p{L})/gu, '$1 ')
    .replace(/(\p{Ll}[.!?])(?=\p{Lu})/gu, '$1 ');
}

type Piece = { t: 'h' | 'li' | 'ol' | 'p' | 'num'; s: string; n?: string };

/**
 * Joylangan (ayniqsa Word'dan) xom matnni chiroyli tuzilmaga keltiradi:
 *  - "1. Sarlavha" (qisqa, nuqtasiz) -> sarlavha;  "a) ...", "- ...", "• ..." -> ro'yxat bandi
 *  - ikki qatorga bo'linib qolgan gaplar birlashtiriladi, har bir abzats orasiga bo'sh qator qo'yiladi
 *  - ortiqcha bo'shliqlar, tinish belgilaridan keyingi bo'shliq, apostrof (o‘ g‘ ’) va tirnoq to'g'rilanadi
 */
export function tidyMd(md: string, lang: string = 'uz'): string {
  const pieces: Piece[] = [];
  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    let m: RegExpExecArray | null;

    if ((m = /^#{1,6}\s+(.*)$/.exec(line))) {
      pieces.push({ t: 'h', s: tidyLine(m[1], lang) });
    } else if ((m = /^(?:\\?[-•–—*]\s+|[A-Za-zЀ-ӿ]\)\s*|\d+\)\s*)(\S.*)$/.exec(line))) {
      pieces.push({ t: 'li', s: tidyLine(m[1], lang) });
    } else if ((m = /^(\d+)\\?[.)]\s*(\S.*)$/.exec(line))) {
      const rest = tidyLine(m[2], lang);
      if (/;$/.test(rest)) pieces.push({ t: 'li', s: rest });
      else if (rest.length <= 120 && !/[.,:]$/.test(rest)) pieces.push({ t: 'num', s: rest, n: m[1] });
      else pieces.push({ t: 'p', s: `${m[1]}\\. ${rest}` });
    } else {
      pieces.push({ t: 'p', s: tidyLine(line, lang) });
    }
  }

  // Qisqa raqamli qator: yolg'iz bo'lsa bo'lim sarlavhasi, ketma-ket kelsa raqamli ro'yxat
  const types = pieces.map((p) => p.t);
  pieces.forEach((p, i) => {
    if (p.t !== 'num') return;
    if (types[i - 1] === 'num' || types[i + 1] === 'num') p.t = 'ol';
    else {
      p.t = 'h';
      p.s = `${p.n}. ${p.s}`;
    }
  });

  // Gap oxirigacha yetmay yangi qatorga o'tgan matnni birlashtirish
  const joined: Piece[] = [];
  for (const p of pieces) {
    const prev = joined[joined.length - 1];
    if (p.t === 'p' && prev?.t === 'p' && !/[.!?:;…”»)]$/.test(prev.s) && /^\p{Ll}/u.test(p.s)) prev.s += ` ${p.s}`;
    else joined.push({ ...p });
  }

  // Ketma-ket ro'yxat bandlari bitta blok, qolganlari alohida blok
  const blocks: string[] = [];
  let list: Piece[] = [];
  const flush = () => {
    if (list.length) blocks.push(list.map((p) => (p.t === 'ol' ? `${p.n}. ${p.s}` : `- ${p.s}`)).join('\n'));
    list = [];
  };
  for (const p of joined) {
    if (p.t === 'li' || p.t === 'ol') {
      if (list.length && list[0].t !== p.t) flush();
      list.push(p);
      continue;
    }
    flush();
    blocks.push(p.t === 'h' ? `## ${p.s}` : p.s);
  }
  flush();
  return blocks.join('\n\n');
}

/** Joylangan (paste) HTML'dan toza Markdown olish: faqat qalin/qiya/sarlavha/ro'yxat/havola saqlanadi */
export function pastedHtmlToMd(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return htmlToMd(doc.body);
}

/** Havola manzilini tekshiradi (muharrir tugmasi uchun) */
export function normalizeLink(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith('/') || v.startsWith('#') ? v : `https://${v}`;
  return safeUrl(withScheme) ? withScheme : null;
}
