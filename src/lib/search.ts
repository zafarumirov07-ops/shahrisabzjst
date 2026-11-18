import { cyrToLat, hasUzbekCyrillic } from '@/lib/i18n/translit';

/** Apostrof variantlari: ' ʻ ʼ ‘ ’ ` ´ */
const APOSTROPHES = ["'", 'ʻ', 'ʼ', '‘', '’', '`', '´'];

/**
 * Qidiruv so'rovini so'zlarga ajratadi: kichik harf, apostrof variantlari olib tashlanadi
 * (o'zbek = o‘zbek = oʻzbek = ozbek), o'zbekcha kirill lotinga o'giriladi.
 */
export function searchTerms(q: string): string[] {
  const base = hasUzbekCyrillic(q) ? cyrToLat(q) : q;
  return [...base.toLowerCase()]
    .filter((ch) => !APOSTROPHES.includes(ch))
    .join('')
    .split(/\s+/)
    .map((t) => t.replace(/[%_\\]/g, ''))
    .filter(Boolean)
    .slice(0, 6);
}

function escapeRe(ch: string): string {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const OPTIONAL_APOSTROPHE = `[${APOSTROPHES.join('')}]?`;

/** Matnda topilgan so'zlarni ajratish uchun regex (apostrof belgilariga e'tibor bermaydi) */
export function highlightRegex(terms: string[]): RegExp | null {
  const parts = terms.filter(Boolean).map((t) => [...t].map(escapeRe).join(OPTIONAL_APOSTROPHE));
  return parts.length ? new RegExp(`(${parts.join('|')})`, 'giu') : null;
}
