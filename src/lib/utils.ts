import type { Locale } from '@/lib/i18n/config';

const INTL_LOCALE: Record<Locale, string> = { uz: 'uz-UZ', oz: 'uz-Cyrl-UZ', ru: 'ru-RU', en: 'en-GB' };

export function formatDate(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Tashkent',
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  }).format(d);
}

export function monthDay(value: string, locale: Locale): { day: string; month: string } {
  const d = new Date(value);
  return {
    day: new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: '2-digit', timeZone: 'Asia/Tashkent' }).format(d),
    month: new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'short', timeZone: 'Asia/Tashkent' }).format(d),
  };
}

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/** Sarlavhadan URL uchun slug: lotin, kirill va o'zbekcha belgilarni qo'llaydi. */
export function slugify(input: string): string {
  const lower = input
    .toLowerCase()
    .replace(/[ʻʼ'’‘`]/g, '')
    .split('')
    .map((ch) => (ch in CYR ? CYR[ch] : ch))
    .join('');
  return lower
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** YouTube / Vimeo havolasini embed URL ga aylantiradi; boshqa bo'lsa null. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) {
        return `https://www.youtube-nocookie.com/embed/${u.pathname.split('/')[2]}`;
      }
    }
    if (host === 'vimeo.com') return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
    return null;
  } catch {
    return null;
  }
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function fileSizeLabel(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
