import Link from 'next/link';
import Icon from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import { tr } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import { homeOf, type Site } from '@/lib/site';
import type { SiteSettings } from '@/lib/types';
import { buildNav, flatNav, LogoMark } from './Header';
import { SocialBadge, knownSocials, socialLabel } from './Social';
import { mapLink } from '@/lib/map';

export default function Footer({
  site,
  locale,
  dict,
  settings,
}: {
  site: Site;
  locale: Locale;
  dict: Dict;
  settings: SiteSettings;
}) {
  const nav = flatNav(buildNav(site, locale, dict));
  const contact = settings.contact ?? {};
  const socials = knownSocials(settings.socials);
  const address = tr(contact.address, locale);
  const mapHref = mapLink(contact, address);

  return (
    <footer className="mt-20 px-3 pb-4 sm:px-5 lg:px-8 2xl:px-12">
      <div
        className="relative isolate mx-auto max-w-[1920px] overflow-hidden rounded-ios-lg p-6 text-white sm:p-12"
        style={{ background: 'linear-gradient(135deg,#031a30 0%,#06335a 60%,#0a5f86 100%)' }}
      >
        <div className="blob absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />
        <div className="blob absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-leaf/20 blur-3xl" style={{ animationDelay: '-7s' }} />

        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-16 w-16" />
              <p className="text-[16px] font-extrabold leading-snug tracking-tight">{dict.siteName}</p>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/70">{dict.tagline}</p>
            {socials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {socials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabel(key)}
                    title={socialLabel(key)}
                    className="rounded-full ring-2 ring-white/20 transition hover:-translate-y-0.5 hover:ring-white/60"
                  >
                    <SocialBadge name={key} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-leaf">{dict.footer.links}</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[15px]">
              {nav.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a href={item.href} className="inline-flex items-center gap-1 text-white/80 transition hover:text-white">
                      {item.label}
                      <Icon name="arrow-up-right" className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={item.href} className="text-white/80 transition hover:text-white">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link href={`${homeOf(site, locale)}/contact`} className="text-white/80 transition hover:text-white">
                  {dict.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-leaf">{dict.footer.contacts}</h2>
            <ul className="space-y-3.5 text-[15px] text-white/85">
              {address && (
                <li className="flex gap-3">
                  <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                  <a href={mapHref} target="_blank" rel="noopener noreferrer" className="hover:text-white" title={dict.contact.map}>
                    {address}
                  </a>
                </li>
              )}
              {contact.phone && (
                <li className="flex gap-3">
                  <Icon name="phone" className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-white">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex gap-3">
                  <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
                  <a href={`mailto:${contact.email}`} className="break-all hover:text-white">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/55">
          © {new Date().getFullYear()} {dict.siteShort}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
