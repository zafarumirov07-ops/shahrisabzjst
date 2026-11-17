'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config';

/** Til almashtirgich (to'q panel ichida) */
export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const segments = pathname.split('/');
  const rest = isLocale(segments[1]) ? segments.slice(2).join('/') : segments.slice(1).join('/');

  return (
    <nav aria-label="Language" className="flex items-center rounded-full bg-black/20 p-0.5">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ''}`}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase transition-colors ${
            l === locale ? 'bg-leaf text-[#04223d]' : 'text-white/75 hover:text-white'
          }`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
