import type { Locale } from '@/lib/i18n/config';

export const SITES = ['main', 'talimsifati'] as const;
export type Site = (typeof SITES)[number];

export function isSite(value: string | undefined | null): value is Site {
  return !!value && (SITES as readonly string[]).includes(value);
}

/** Subdomen nomi (talimsifati.<domen> -> "talimsifati"). */
export const SUBDOMAIN: Record<Exclude<Site, 'main'>, string> = {
  talimsifati: 'talimsifati',
};

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

export function siteFromHost(host: string | null | undefined): Site {
  const h = (host || '').split(':')[0].toLowerCase();
  if (h.startsWith(`${SUBDOMAIN.talimsifati}.`)) return 'talimsifati';
  return 'main';
}

function protocolFor(domain: string): string {
  return domain.startsWith('localhost') || domain.startsWith('127.') ? 'http' : 'https';
}

/** Boshqa saytga (subdomenga) to'liq havola. */
export function siteUrl(site: Site, locale: Locale, path = ''): string {
  const domain = ROOT_DOMAIN.replace(/^www\./, '');
  const host = site === 'main' ? domain : `${SUBDOMAIN[site]}.${domain}`;
  return `${protocolFor(domain)}://${host}/${locale}${path}`;
}
