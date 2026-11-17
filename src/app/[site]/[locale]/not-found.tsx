'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { getDict } from '@/lib/i18n/dictionaries';
import { QUALITY_SLUG } from '@/lib/site';

// Til va sayt brauzer manzilidan aniqlanadi (cookies ishlatilmaydi, shuning uchun ISR buzilmaydi)
export default function NotFound() {
  const parts = (usePathname() || '').split('/').filter(Boolean);
  const prefix = parts[0] === QUALITY_SLUG ? `/${QUALITY_SLUG}` : '';
  const maybeLocale = prefix ? parts[1] : parts[0];
  const locale = isLocale(maybeLocale) ? maybeLocale : DEFAULT_LOCALE;
  const dict = getDict(locale);

  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">{dict.common.notFoundTitle}</h1>
      <p className="mt-2 max-w-md text-muted">{dict.common.notFoundText}</p>
      <Link href={`${prefix}/${locale}`} className="btn mt-6">
        {dict.common.goHome}
      </Link>
    </div>
  );
}
