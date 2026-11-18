import { latToCyr } from './translit';

/**
 * uz  - o'zbekcha (lotin), asosiy til: havolada til yozilmasa shu til ochiladi
 * oz  - o'zbekcha (kirill)
 * ru, en
 */
export const LOCALES = ['uz', 'oz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  oz: 'Ўзбекча',
  ru: 'Русский',
  en: 'English',
};

/** Til almashtirgichdagi qisqa yozuv */
export const LOCALE_SHORT: Record<Locale, string> = { uz: 'UZ', oz: 'ЎЗ', ru: 'RU', en: 'EN' };

/** <html lang> va hreflang uchun til kodi */
export const HTML_LANG: Record<Locale, string> = {
  uz: 'uz',
  oz: 'uz-Cyrl',
  ru: 'ru',
  en: 'en',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Ko'p tilli jsonb maydon: {"uz": "...", "oz": "...", "ru": "...", "en": "..."} */
export type I18n = Partial<Record<Locale, string>> | null | undefined;

/**
 * Tanlangan tildagi matn. Tartib: shu til -> (oz uchun) lotin matnni kirillga o'girish ->
 * o'zbekcha lotin -> birinchi mavjud tarjima.
 */
export function tr(value: I18n, locale: Locale): string {
  if (!value || typeof value !== 'object') return '';
  const own = value[locale];
  if (own) return own;
  if (locale === 'oz' && value.uz) return latToCyr(value.uz);
  return value[DEFAULT_LOCALE] || Object.values(value).find(Boolean) || '';
}
