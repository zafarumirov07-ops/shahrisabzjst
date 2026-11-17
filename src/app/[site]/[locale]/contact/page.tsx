import type { Metadata } from 'next';
import Icon, { type IconName } from '@/components/Icon';
import { PageHeader, SOCIAL_ICON } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getSettings } from '@/lib/data';
import { tr } from '@/lib/i18n/config';

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
  const socials = Object.entries(settings.socials ?? {}).filter(([, v]) => !!v);

  const rows: Array<{ icon: IconName; label: string; value: string; href?: string; action?: string }> = [];
  if (address)
    rows.push({
      icon: 'pin',
      label: dict.contact.address,
      value: address,
      href: c.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
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

        {socials.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {socials.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="btn-outline capitalize">
                <Icon name={SOCIAL_ICON[k] ?? 'link'} className="h-[18px] w-[18px]" />
                {k}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
