'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, LOCALE_LABELS, LOCALE_SHORT, isLocale, type Locale } from '@/lib/i18n/config';
import { QUALITY_SLUG } from '@/lib/site';

/** Til almashtirgich. /talimsifati prefiksini saqlaydi; asosiy til (uz) uchun havolada til yozilmaydi. */
export default function LocaleSwitcher({ locale, variant = 'dark' }: { locale: Locale; variant?: 'dark' | 'light' }) {
  const pathname = usePathname() || '/';
  // useSearchParams() butun layoutni dinamik qilib qo'yadi, shuning uchun query brauzerdan o'qiladi
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(window.location.search.replace(/^\?/, '')), [pathname]);
  const segments = pathname.split('/').filter(Boolean);
  const prefix = segments[0] === QUALITY_SLUG ? `/${QUALITY_SLUG}` : '';
  const afterPrefix = prefix ? segments.slice(1) : segments;
  const rest = (isLocale(afterPrefix[0]) ? afterPrefix.slice(1) : afterPrefix).join('/');

  const hrefFor = (l: Locale) => {
    const lang = l === DEFAULT_LOCALE ? '' : `/${l}`;
    const path = `${prefix}${lang}${rest ? `/${rest}` : ''}` || '/';
    return search ? `${path}?${search}` : path;
  };

  return (
    <nav
      aria-label="Language"
      className={variant === 'light' ? 'flex items-center rounded-full bg-surface2 p-1' : 'flex items-center rounded-full bg-black/20 p-0.5'}
    >
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          hrefLang={HTML_LANG[l]}
          lang={HTML_LANG[l]}
          title={LOCALE_LABELS[l]}
          aria-label={LOCALE_LABELS[l]}
          aria-current={l === locale ? 'true' : undefined}
          className={
            variant === 'light'
              ? `flex-1 rounded-full px-3 py-2 text-center text-[14px] font-bold transition-colors ${
                  l === locale ? 'bg-leaf text-[#04223d] shadow-ios' : 'text-muted'
                }`
              : `rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
                  l === locale ? 'bg-leaf text-[#04223d]' : 'text-white/75 hover:text-white'
                }`
          }
        >
          {LOCALE_SHORT[l]}
        </Link>
      ))}
    </nav>
  );
}
