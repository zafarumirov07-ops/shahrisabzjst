'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config';
import { QUALITY_SLUG } from '@/lib/site';

/** Til almashtirgich (to'q panel ichida). /talimsifati/... prefiksini saqlab qoladi. */
export default function LocaleSwitcher({ locale, variant = 'dark' }: { locale: Locale; variant?: 'dark' | 'light' }) {
  const pathname = usePathname() || `/${locale}`;
  const segments = pathname.split('/').filter(Boolean);
  const prefix = segments[0] === QUALITY_SLUG ? `/${QUALITY_SLUG}` : '';
  const afterPrefix = prefix ? segments.slice(1) : segments;
  const rest = (isLocale(afterPrefix[0]) ? afterPrefix.slice(1) : afterPrefix).join('/');

  return (
    <nav
      aria-label="Language"
      className={variant === 'light' ? 'flex items-center rounded-full bg-surface2 p-1' : 'flex items-center rounded-full bg-black/20 p-0.5'}
    >
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`${prefix}/${l}${rest ? `/${rest}` : ''}`}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          className={
            variant === 'light'
              ? `flex-1 rounded-full px-4 py-2 text-center text-[14px] font-bold uppercase transition-colors ${
                  l === locale ? 'bg-leaf text-[#04223d] shadow-ios' : 'text-muted'
                }`
              : `rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase transition-colors ${
                  l === locale ? 'bg-leaf text-[#04223d]' : 'text-white/75 hover:text-white'
                }`
          }
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
