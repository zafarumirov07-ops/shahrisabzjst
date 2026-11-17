import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import { siteUrl, type Site } from '@/lib/site';
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
  const base = `/${locale}`;
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
      { label: dict.nav.home, icon: 'home', href: base },
      media,
      { label: dict.nav.teamQuality, icon: 'users', href: `${base}/team` },
      { label: dict.nav.gallery, icon: 'image', href: `${base}/gallery` },
      { label: dict.nav.mainSite, icon: 'building', href: siteUrl('main', locale), external: true },
    ];
  }
  return [
    { label: dict.nav.home, icon: 'home', href: base },
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
  const title = site === 'talimsifati' ? dict.qualitySiteName : dict.siteShort;

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8 2xl:px-12">
      <div className="glass mx-auto flex max-w-[1920px] items-center justify-between gap-3 rounded-full py-1.5 pl-2 pr-1.5 text-white shadow-ios-lg ring-1 ring-white/10 sm:pl-3 sm:pr-2">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2.5" aria-label={dict.siteName}>
          <LogoMark className="h-10 w-10 sm:h-11 sm:w-11" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-extrabold tracking-tight sm:text-[15px]">{title}</span>
            <span className="hidden truncate text-[11.5px] text-white/65 sm:block">
              {site === 'talimsifati' ? dict.siteShort : 'Shahrisabz'}
            </span>
          </span>
        </Link>

        <NavLinks groups={groups} />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher locale={locale} />
          <A11yPanel labels={dict.a11y} />
          <Link href={`/${locale}/contact`} className="btn hidden !px-5 !py-2.5 sm:inline-flex">
            {dict.home.contactCta}
            <Icon name="arrow-up-right" className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <MobileMenu groups={groups} title={dict.nav.menu} cta={{ href: `/${locale}/contact`, label: dict.home.contactCta }} />
        </div>
      </div>
    </header>
  );
}
