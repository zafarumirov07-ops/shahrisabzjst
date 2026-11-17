import Link from 'next/link';
import Icon from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import { tr } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import type { Site } from '@/lib/site';
import type { SiteSettings } from '@/lib/types';
import { buildNav, LogoMark } from './Header';
import { SOCIAL_ICON } from './ui';

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
  const nav = buildNav(site, locale, dict);
  const contact = settings.contact ?? {};
  const socials = Object.entries(settings.socials ?? {}).filter(([, v]) => !!v);
  const address = tr(contact.address, locale);

  return (
    <footer className="mt-16 pb-24 lg:pb-0">
      <div className="container-page">
        <div className="rounded-ios-lg bg-surface p-6 shadow-ios sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-3">
                <LogoMark className="h-14 w-14" />
                <p className="text-[15px] font-semibold leading-snug tracking-tight">{dict.siteName}</p>
              </div>
              <p className="mt-4 text-sm text-muted">{dict.tagline}</p>
              {socials.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socials.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent transition active:scale-95"
                    >
                      <Icon name={SOCIAL_ICON[key] ?? 'link'} className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{dict.footer.links}</h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[15px]">
                {nav.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a href={item.href} className="inline-flex items-center gap-1 hover:text-accent">
                        {item.label}
                        <Icon name="arrow-up-right" className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Link href={item.href} className="hover:text-accent">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{dict.footer.contacts}</h2>
              <ul className="space-y-3 text-[15px]">
                {address && (
                  <li className="flex gap-3">
                    <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span>{address}</span>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex gap-3">
                    <Icon name="phone" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-accent">
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li className="flex gap-3">
                    <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <a href={`mailto:${contact.email}`} className="break-all hover:text-accent">
                      {contact.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <p className="py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} {dict.siteShort}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
