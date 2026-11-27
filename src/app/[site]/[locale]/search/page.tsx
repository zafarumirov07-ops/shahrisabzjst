import type { Metadata } from 'next';
import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import { EmptyState, Highlight, PageHeader, Pagination, SearchForm } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { searchContent } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { searchTerms } from '@/lib/search';
import type { SearchHit, SearchType } from '@/lib/types';
import { formatDate, plainText } from '@/lib/utils';

const PAGE = 12;

const TYPE_ICON: Record<SearchType, IconName> = {
  news: 'newspaper',
  announcement: 'megaphone',
  event: 'calendar',
  album: 'image',
  program: 'graduation',
  page: 'file',
  library: 'book',
  resource: 'globe',
};

function hitHref(base: string, h: SearchHit): string {
  switch (h.type) {
    case 'news':
      return `${base}/news/${h.slug}`;
    case 'announcement':
      return `${base}/announcements/${h.slug}`;
    case 'library':
      return `${base}/library/${h.slug}`;
    case 'resource':
      return `${base}/resources/${h.slug}`;
    case 'event':
      return `${base}/events/${h.slug}`;
    case 'album':
      return `${base}/gallery/${h.slug}`;
    case 'program':
      return `${base}/programs/${h.slug}`;
    default:
      return `${base}/p/${h.slug}`;
  }
}

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.search.title, robots: { index: false, follow: true } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: SiteParams;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { site, locale, dict, base } = await getCtx(params);
  const sp = await searchParams;
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const terms = searchTerms(q);
  const { rows, total } = q ? await searchContent({ site, q, page, limit: PAGE }) : { rows: [], total: 0 };

  return (
    <>
      <PageHeader title={dict.search.title} />
      <div className="container-page max-w-3xl space-y-6 py-6 sm:py-8">
        <SearchForm action={`${base}/search`} q={q} dict={dict} autoFocus={!q} />

        {!q ? (
          <p className="text-center text-muted">{dict.search.hint}</p>
        ) : rows.length === 0 ? (
          <EmptyState text={dict.search.none} icon="search" />
        ) : (
          <>
            <p className="text-sm font-medium text-muted">
              {dict.search.found}: {total}
            </p>
            <ul className="list">
              {rows.map((h) => {
                const title = tr(h.title, locale);
                const snippet = plainText(tr(h.snippet, locale));
                return (
                  <li key={`${h.type}-${h.id}`}>
                    <Link href={hitHref(base, h)} className="list-row !items-start">
                      {h.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.cover_url} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-xl bg-surface2 object-cover" />
                      ) : (
                        <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
                          <Icon name={TYPE_ICON[h.type]} className="h-7 w-7" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                          <span className="chip">{dict.search.type[h.type]}</span>
                          {h.at && h.type !== 'program' && h.type !== 'page' && <time dateTime={h.at}>{formatDate(h.at, locale)}</time>}
                        </span>
                        <span className="mt-1 block text-[17px] font-semibold leading-snug">
                          <Highlight text={title} terms={terms} />
                        </span>
                        {snippet && (
                          <span className="mt-1 line-clamp-2 block text-[14.5px] text-muted">
                            <Highlight text={snippet} terms={terms} />
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} total={total} pageSize={PAGE} basePath={`${base}/search`} dict={dict} query={{ q }} />
          </>
        )}
      </div>
    </>
  );
}
