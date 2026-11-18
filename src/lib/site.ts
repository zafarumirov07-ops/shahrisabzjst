import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

export const SITES = ['main', 'talimsifati'] as const;
export type Site = (typeof SITES)[number];

export function isSite(value: string | undefined | null): value is Site {
  return !!value && (SITES as readonly string[]).includes(value);
}

/** Subdomen / yo'l nomi */
export const QUALITY_SLUG = 'talimsifati';

/**
 * Ta'lim sifati sayti qanday ochiladi:
 *  - "path" (standart): asosiy domen ichida  /talimsifati/uz/...   (domen kerak emas)
 *  - "subdomain": talimsifati.<domen>/uz/...   (Vercel'da NEXT_PUBLIC_QUALITY_MODE=subdomain qo'yiladi)
 * Har ikki holatda ham /talimsifati/... manzili ishlaydi.
 */
export const QUALITY_MODE: 'path' | 'subdomain' =
  process.env.NEXT_PUBLIC_QUALITY_MODE === 'subdomain' ? 'subdomain' : 'path';

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

export function siteFromHost(host: string | null | undefined): Site {
  const h = (host || '').split(':')[0].toLowerCase();
  if (h.startsWith(`${QUALITY_SLUG}.`)) return 'talimsifati';
  return 'main';
}

function protocolFor(domain: string): string {
  return domain.startsWith('localhost') || domain.startsWith('127.') ? 'http' : 'https';
}

/**
 * Sayt ichidagi bosh yo'l (shu sayt sahifalari uchun havolalar shundan boshlanadi):
 *   main         -> /uz
 *   talimsifati  -> /talimsifati/uz   (path rejimida)  yoki  /uz  (subdomen rejimida)
 */
export function homeOf(site: Site, locale: Locale): string {
  const isDefault = locale === DEFAULT_LOCALE;
  if (site === 'talimsifati' && QUALITY_MODE === 'path') {
    return isDefault ? `/${QUALITY_SLUG}` : `/${QUALITY_SLUG}/${locale}`;
  }
  return isDefault ? '' : `/${locale}`;
}

/** Bosh sahifa havolasi uchun: bo'sh qator o'rniga "/" */
export function homeHref(site: Site, locale: Locale): string {
  return homeOf(site, locale) || '/';
}

/** Boshqa saytga havola. Path rejimida bir xil domen ichidagi yo'l, subdomen rejimida to'liq manzil. */
export function siteUrl(site: Site, locale: Locale, path = ''): string {
  if (QUALITY_MODE === 'path') return `${homeOf(site, locale)}${path}` || '/';
  const domain = ROOT_DOMAIN.replace(/^www\./, '');
  const host = site === 'main' ? domain : `${QUALITY_SLUG}.${domain}`;
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return `${protocolFor(domain)}://${host}${prefix}${path}` + (prefix || path ? '' : '/');
}
