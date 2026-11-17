import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import { siteUrl, type Site } from '@/lib/site';
import A11yPanel from './A11yPanel';
import LocaleSwitcher from './LocaleSwitcher';
import NavLinks from './NavLinks';
import TabBar from './TabBar';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  external?: boolean;
  /** Kompyuterdagi asosiy menyuda ko'rinadi */
  primary?: boolean;
  /** Telefondagi pastki tab barda ko'rinadi */
  tab?: boolean;
};

export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="" width={96} height={96} className={`${className} shrink-0 rounded-full object-cover`} />
  );
}

export function buildNav(site: Site, locale: Locale, dict: Dict): NavItem[] {
  const base = `/${locale}`;
  if (site === 'talimsifati') {
    return [
      { href: base, label: dict.nav.home, icon: 'home', primary: true, tab: true },
      { href: `${base}/news`, label: dict.nav.news, icon: 'newspaper', primary: true, tab: true },
      { href: `${base}/announcements`, label: dict.nav.announcements, icon: 'megaphone', primary: true },
      { href: `${base}/team`, label: dict.nav.teamQuality, icon: 'users', primary: true, tab: true },
      { href: `${base}/gallery`, label: dict.nav.gallery, icon: 'image', primary: true, tab: true },
      { href: `${base}/events`, label: dict.nav.events, icon: 'calendar', primary: true },
      { href: `${base}/contact`, label: dict.nav.contact, icon: 'phone', primary: true },
      { href: siteUrl('main', locale), label: dict.nav.mainSite, icon: 'building', external: true, primary: true },
    ];
  }
  return [
    { href: base, label: dict.nav.home, icon: 'home', primary: true, tab: true },
    { href: `${base}/p/about`, label: dict.nav.about, icon: 'info', primary: true },
    { href: `${base}/news`, label: dict.nav.news, icon: 'newspaper', primary: true, tab: true },
    { href: `${base}/announcements`, label: dict.nav.announcements, icon: 'megaphone', primary: true },
    { href: `${base}/admission`, label: dict.nav.admission, icon: 'graduation', primary: true, tab: true },
    { href: `${base}/team`, label: dict.nav.team, icon: 'users', primary: true },
    { href: `${base}/gallery`, label: dict.nav.gallery, icon: 'image', primary: true, tab: true },
    { href: `${base}/events`, label: dict.nav.events, icon: 'calendar' },
    { href: `${base}/contact`, label: dict.nav.contact, icon: 'phone', primary: true },
    { href: siteUrl('talimsifati', locale), label: dict.nav.quality, icon: 'shield', external: true, primary: true },
  ];
}

export default function Header({ site, locale, dict }: { site: Site; locale: Locale; dict: Dict }) {
  const items = buildNav(site, locale, dict);
  const title = site === 'talimsifati' ? dict.qualitySiteName : dict.siteShort;

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-[3.75rem]">
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2.5" aria-label={dict.siteName}>
            <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="min-w-0 leading-tight lg:hidden 2xl:block">
              <span className="block truncate text-[15px] font-semibold tracking-tight">{title}</span>
              <span className="hidden truncate text-xs text-muted sm:block">
                {site === 'talimsifati' ? dict.siteShort : dict.tagline}
              </span>
            </span>
          </Link>

          <NavLinks items={items.filter((i) => i.primary)} />

          <div className="flex shrink-0 items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <A11yPanel labels={dict.a11y} />
          </div>
        </div>
      </header>
      <TabBar items={items} moreLabel={dict.nav.more} />
    </>
  );
}
