import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/site/Markdown';
import { PageHeader } from '@/components/site/ui';
import { getCtx } from '@/lib/ctx';
import { getEventByKey } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { plainText, formatDateTime } from '@/lib/utils';

type Params = Promise<{ site: string; locale: string; slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const { site, locale } = await getCtx(Promise.resolve(p));
  const ev = await getEventByKey(site, decodeURIComponent(p.slug));
  if (!ev) return {};
  const title = tr(ev.title, locale);
  const description = plainText(tr(ev.description, locale)).slice(0, 200) || undefined;
  return { title, description, openGraph: { title, description, images: ev.cover_url ? [ev.cover_url] : undefined } };
}

export default async function EventPage({ params }: { params: Params }) {
  const p = await params;
  const { site, locale, dict, base } = await getCtx(Promise.resolve(p));
  const ev = await getEventByKey(site, decodeURIComponent(p.slug));
  if (!ev) notFound();

  const location = tr(ev.location, locale);
  const description = tr(ev.description, locale);

  return (
    <>
      <PageHeader title={tr(ev.title, locale)} />
      <article className="container-page max-w-3xl space-y-6 py-6 sm:py-8">
        <Link href={`${base}/events`} className="link inline-flex items-center text-[15px] font-medium">
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {dict.eventPage.back}
        </Link>

        <ul className="list">
          <li className="list-row">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[var(--accent-fg)]">
              <Icon name="calendar" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[13px] font-medium text-muted">{dict.eventPage.when}</span>
              <time className="block text-[16px] font-medium" dateTime={ev.starts_at}>
                {formatDateTime(ev.starts_at, locale)}
              </time>
            </span>
          </li>
          {location && (
            <li className="list-row">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[var(--accent-fg)]">
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-muted">{dict.eventPage.where}</span>
                <span className="block text-[16px] font-medium">{location}</span>
              </span>
            </li>
          )}
        </ul>

        {ev.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.cover_url} alt="" className="max-h-[30rem] w-full rounded-ios-lg object-cover shadow-ios" />
        )}

        {description && <Markdown>{description}</Markdown>}
      </article>
    </>
  );
}
