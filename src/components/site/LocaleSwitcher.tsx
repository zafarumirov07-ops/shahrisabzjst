'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config';

/** iOS segmented control ko'rinishidagi til almashtirgich */
export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const segments = pathname.split('/');
  const rest = isLocale(segments[1]) ? segments.slice(2).join('/') : segments.slice(1).join('/');

  return (
    <nav aria-label="Language" className="segmented">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ''}`}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className="uppercase"
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
