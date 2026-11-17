'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { getDict } from '@/lib/i18n/dictionaries';

// Til brauzer manzilidan aniqlanadi (cookies ishlatilmaydi, shuning uchun ISR buzilmaydi)
export default function NotFound() {
  const first = (usePathname() || '').split('/')[1];
  const locale = isLocale(first) ? first : DEFAULT_LOCALE;
  const dict = getDict(locale);

  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">{dict.common.notFoundTitle}</h1>
      <p className="mt-2 max-w-md text-muted">{dict.common.notFoundText}</p>
      <Link href={`/${locale}`} className="btn mt-6">
        {dict.common.goHome}
      </Link>
    </div>
  );
}
