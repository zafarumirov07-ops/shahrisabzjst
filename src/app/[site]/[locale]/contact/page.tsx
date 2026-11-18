import type { Metadata } from 'next';
import Icon, { type IconName } from '@/components/Icon';
import { SocialBadge, knownSocials, socialLabel } from '@/components/site/Social';
import { PageHeader } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getSettings } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { mapEmbed, mapLink, routeLink } from '@/lib/map';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.contact.title };
}

export default async function ContactPage({ params }: { params: SiteParams }) {
  const { site, locale, dict } = await getCtx(params);
  const settings = await getSettings(site);
  const c = settings.contact ?? {};
  const address = tr(c.address, locale);
  const hours = tr(c.working_hours, locale);
  const socials = knownSocials(settings.socials);
  const embed = mapEmbed(c, address);
  const route = routeLink(c, address);

  const rows: Array<{ icon: IconName; label: string; value: string; href?: string; action?: string }> = [];
  if (address)
    rows.push({
      icon: 'pin',
      label: dict.contact.address,
      value: address,
      href: mapLink(c, address),
      action: dict.contact.map,
    });
  if (c.phone)
    rows.push({ icon: 'phone', label: dict.contact.phone, value: c.phone, href: `tel:${c.phone.replace(/\s/g, '')}`, action: dict.contact.call });
  if (c.email)
    rows.push({ icon: 'mail', label: dict.contact.email, value: c.email, href: `mailto:${c.email}`, action: dict.contact.write });
  if (hours) rows.push({ icon: 'clock', label: dict.contact.hours, value: hours });

  return (
    <>
      <PageHeader title={dict.contact.title} />
      <div className="container-page max-w-3xl space-y-6 py-6 sm:py-8">
        {rows.length === 0 ? (
          <p className="card p-8 text-center text-muted">{dict.common.noData}</p>
        ) : (
          <ul className="list">
            {rows.map((r) => {
              const body = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[var(--accent-fg)]">
                    <Icon name={r.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-muted">{r.label}</span>
                    <span className="block break-words text-[16px] font-medium">{r.value}</span>
                  </span>
                  {r.href && (
                    <span className="link hidden shrink-0 items-center gap-0.5 text-sm font-medium sm:inline-flex">
                      {r.action}
                      <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                  )}
                </>
              );
              return (
                <li key={r.label}>
                  {r.href ? (
                    <a href={r.href} className="list-row" target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                      {body}
                    </a>
                  ) : (
                    <div className="list-row">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {embed && (
          <section aria-label={dict.contact.ourLocation} className="card overflow-hidden">
            <iframe
              src={embed}
              title={dict.contact.ourLocation}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-[320px] w-full border-0 sm:h-[420px]"
            />
            {route && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="text-[15px] font-medium">{address}</p>
                <a href={route} target="_blank" rel="noopener noreferrer" className="btn !px-5 !py-2.5">
                  <Icon name="pin" className="h-[18px] w-[18px]" />
                  {dict.contact.route}
                </a>
              </div>
            )}
          </section>
        )}

        {socials.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {socials.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="btn-outline !gap-2.5 !pl-2">
                <SocialBadge name={k} className="h-7 w-7" glyphClass="h-4 w-4" />
                {socialLabel(k)}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
