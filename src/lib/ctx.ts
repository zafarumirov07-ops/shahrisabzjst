import { notFound } from 'next/navigation';
import { getDict, type Dict } from '@/lib/i18n/dictionaries';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { isSite, type Site } from '@/lib/site';

export type Ctx = { site: Site; locale: Locale; dict: Dict };
export type SiteParams = Promise<{ site: string; locale: string }>;

/** Marshrut parametrlarini tekshirib, sayt / til / lug'at kontekstini qaytaradi. */
export async function getCtx(params: SiteParams): Promise<Ctx> {
  const { site, locale } = await params;
  if (!isSite(site) || !isLocale(locale)) notFound();
  return { site, locale, dict: getDict(locale) };
}
