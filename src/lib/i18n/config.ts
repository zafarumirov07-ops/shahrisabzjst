export const LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Ko'p tilli jsonb maydon: {"uz": "...", "ru": "...", "en": "..."} */
export type I18n = Partial<Record<Locale, string>> | null | undefined;

/** Tanlangan tildagi matn; bo'sh bo'lsa o'zbekcha, u ham bo'lmasa birinchi mavjud tarjima. */
export function tr(value: I18n, locale: Locale): string {
  if (!value || typeof value !== 'object') return '';
  return value[locale] || value[DEFAULT_LOCALE] || Object.values(value).find(Boolean) || '';
}
