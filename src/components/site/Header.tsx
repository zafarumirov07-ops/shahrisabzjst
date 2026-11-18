import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import { homeOf, siteUrl, type Site } from '@/lib/site';
import A11yPanel from './A11yPanel';
import LocaleSwitcher from './LocaleSwitcher';
import MobileMenu from './MobileMenu';
import NavLinks from './NavLinks';

export type NavLeaf = { href: string; label: string; icon: IconName; external?: boolean };
export type NavGroup = {
  label: string;
  icon: IconName;
  href?: string;
  external?: boolean;
  children?: NavLeaf[];
};

export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="" width={96} height={96} className={`${className} shrink-0 rounded-full object-cover`} />
  );
}

/** Menyu qisqa: 5 tagacha bo'lim, qolganlari ochiladigan guruhlar ichida. "Ta'lim sifati" doim ko'rinib turadi. */
export function buildNav(site: Site, locale: Locale, dict: Dict): NavGroup[] {
  const base = homeOf(site, locale);
  const media: NavGroup = {
    label: dict.nav.media,
    icon: 'newspaper',
    children: [
      { href: `${base}/news`, label: dict.nav.news, icon: 'newspaper' },
      { href: `${base}/announcements`, label: dict.nav.announcements, icon: 'megaphone' },
      { href: `${base}/events`, label: dict.nav.events, icon: 'calendar' },
    ],
  };

  if (site === 'talimsifati') {
    return [
      { label: dict.nav.home, icon: 'home', href: base || '/' },
      media,
      { label: dict.nav.teamQuality, icon: 'users', href: `${base}/team` },
      { label: dict.nav.gallery, icon: 'image', href: `${base}/gallery` },
      { label: dict.nav.mainSite, icon: 'building', href: siteUrl('main', locale), external: true },
    ];
  }
  return [
    { label: dict.nav.home, icon: 'home', href: base || '/' },
    {
      label: dict.nav.school,
      icon: 'building',
      children: [
        { href: `${base}/p/about`, label: dict.nav.about, icon: 'info' },
        { href: `${base}/team`, label: dict.nav.team, icon: 'users' },
        { href: `${base}/gallery`, label: dict.nav.gallery, icon: 'image' },
      ],
    },
    { label: dict.nav.admission, icon: 'graduation', href: `${base}/admission` },
    media,
    { label: dict.nav.quality, icon: 'shield', href: siteUrl('talimsifati', locale), external: true },
  ];
}

/** Footer va boshqa joylar uchun tekis ro'yxat */
export function flatNav(groups: NavGroup[]): NavLeaf[] {
  return groups.flatMap((g) =>
    g.children ? g.children : g.href ? [{ href: g.href, label: g.label, icon: g.icon, external: g.external }] : [],
  );
}

export default function Header({ site, locale, dict }: { site: Site; locale: Locale; dict: Dict }) {
  const groups = buildNav(site, locale, dict);
  const base = homeOf(site, locale);
  const isQuality = site === 'talimsifati';

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8 2xl:px-12">
      {/* Texnikum nomi doim to'liq ko'rinadi: kerak bo'lsa ikki qatorga o'raladi.
          lg..2xl oralig'ida menyu ikkinchi qatorga tushadi, 2xl dan boshlab hammasi bir qatorda. */}
      <div className="glass mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-[1.75rem] py-2 pl-2 pr-2 text-white shadow-ios-lg ring-1 ring-white/10 sm:pl-3 2xl:flex-nowrap 2xl:rounded-full 2xl:py-1.5">
        <Link href={base || '/'} className="flex min-w-0 flex-1 items-center gap-2.5 2xl:flex-none" aria-label={dict.siteName}>
          <LogoMark className="h-10 w-10 sm:h-12 sm:w-12" />
          <span className="min-w-0">
            {isQuality && (
              <span className="block text-[13px] font-extrabold leading-tight tracking-tight sm:text-[15px]">
                {dict.qualitySiteName}
              </span>
            )}
            <span
              className={
                isQuality
                  ? 'block text-[10.5px] leading-snug text-white/70 sm:text-[12px] 2xl:max-w-[20rem]'
                  : 'block text-[12px] font-extrabold leading-[1.2] tracking-tight sm:text-[14.5px] 2xl:max-w-[20rem]'
              }
            >
              {dict.siteName}
            </span>
          </span>
        </Link>

        <div className="order-last hidden w-full justify-center lg:flex 2xl:order-none 2xl:w-auto">
          <NavLinks groups={groups} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} />
          </div>
          <A11yPanel labels={dict.a11y} />
          <Link href={`${base}/contact`} className="btn hidden !px-5 !py-2.5 sm:inline-flex">
            {dict.home.contactCta}
            <Icon name="arrow-up-right" className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <MobileMenu
            groups={groups}
            title={dict.nav.menu}
            locale={locale}
            languageLabel={dict.common.language}
            cta={{ href: `${base}/contact`, label: dict.home.contactCta }}
          />
        </div>
      </div>
    </header>
  );
}
