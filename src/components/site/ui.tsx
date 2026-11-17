import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { tr, type Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import type { EventRow, Post, Staff } from '@/lib/types';
import { formatDate, monthDay } from '@/lib/utils';

export const SOCIAL_ICON: Record<string, IconName> = {
  telegram: 'telegram',
  instagram: 'instagram',
  facebook: 'facebook',
  youtube: 'youtube',
};

export function SectionHeading({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link href={href} className="link inline-flex shrink-0 items-center text-[15px] font-medium">
          {hrefLabel}
          <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}

/** iOS "large title" uslubidagi sahifa sarlavhasi */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="container-page pb-2 pt-8 sm:pt-12">
      <h1 className="large-title">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-[17px] text-muted">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ text, icon = 'folder' }: { text: string; icon?: IconName }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center text-muted">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p>{text}</p>
    </div>
  );
}

export function PostCard({ post, locale, dict }: { post: Post; locale: Locale; dict: Dict }) {
  const section = post.kind === 'announcement' ? 'announcements' : 'news';
  const href = `/${locale}/${section}/${post.slug}`;
  return (
    <article className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-ios-lg">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-surface2">
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d6e9ff] to-[#d9f5e0] text-accent">
            <Icon name="cross" className="h-12 w-12 opacity-60" strokeWidth={1.4} />
          </div>
        )}
        {post.pinned && (
          <span className="chip absolute left-3 top-3 !bg-accent !text-[var(--accent-fg)]">
            <Icon name="star" className="h-3 w-3" />
            {dict.common.pinned}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <time className="text-[13px] font-medium text-muted" dateTime={post.published_at ?? undefined}>
          {formatDate(post.published_at, locale)}
        </time>
        <h3 className="mt-1.5 line-clamp-2 text-[19px] font-semibold leading-snug tracking-tight">
          <Link href={href} className="hover:text-accent">
            {tr(post.title, locale)}
          </Link>
        </h3>
        {tr(post.excerpt, locale) && (
          <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-muted">{tr(post.excerpt, locale)}</p>
        )}
        <Link href={href} className="link mt-auto inline-flex items-center pt-4 text-[15px] font-medium">
          {dict.common.readMore}
          <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </article>
  );
}

/** Ro'yxat ichidagi tadbir qatori: <ul className="list"> ichida ishlatiladi */
export function EventItem({ event, locale }: { event: EventRow; locale: Locale }) {
  const { day, month } = monthDay(event.starts_at, locale);
  return (
    <li className="list-row !items-start">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
        <span className="text-xl font-bold leading-none">{day}</span>
        <span className="mt-0.5 text-[11px] font-semibold uppercase">{month}</span>
      </div>
      <div className="min-w-0 pt-0.5">
        <h3 className="font-semibold leading-snug">{tr(event.title, locale)}</h3>
        {tr(event.location, locale) && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <Icon name="pin" className="h-3.5 w-3.5" />
            {tr(event.location, locale)}
          </p>
        )}
        {tr(event.description, locale) && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{tr(event.description, locale)}</p>
        )}
      </div>
    </li>
  );
}

export function StaffCard({ person, locale, dict }: { person: Staff; locale: Locale; dict: Dict }) {
  const socials = Object.entries(person.socials ?? {}).filter(([, v]) => !!v);
  return (
    <li className="card flex flex-col items-center p-6 text-center">
      <div className="h-28 w-28 overflow-hidden rounded-full bg-surface2 shadow-ios">
        {person.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photo_url} alt={person.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Icon name="user" className="h-12 w-12" strokeWidth={1.4} />
          </div>
        )}
      </div>
      <h3 className="mt-4 font-semibold leading-snug tracking-tight">{person.full_name}</h3>
      <p className="mt-1 text-sm text-muted">{tr(person.position, locale)}</p>
      <div className="mt-3 space-y-1 text-sm">
        {person.phone && (
          <p>
            <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="link" aria-label={dict.team.phone}>
              {person.phone}
            </a>
          </p>
        )}
        {person.email && (
          <p>
            <a href={`mailto:${person.email}`} className="link break-all" aria-label={dict.team.email}>
              {person.email}
            </a>
          </p>
        )}
      </div>
      {socials.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {socials.map(([k, url]) => (
            <a
              key={k}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={k}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent"
            >
              <Icon name={SOCIAL_ICON[k] ?? 'link'} className="h-[18px] w-[18px]" />
            </a>
          ))}
        </div>
      )}
    </li>
  );
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  dict,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  dict: Dict;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const link = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      {page > 1 && (
        <Link href={link(page - 1)} className="btn-outline">
          <Icon name="chevron-left" className="h-4 w-4" strokeWidth={2.2} />
          {dict.common.prev}
        </Link>
      )}
      <span className="px-2 text-sm font-medium text-muted">
        {page} / {pages}
      </span>
      {page < pages && (
        <Link href={link(page + 1)} className="btn-outline">
          {dict.common.next}
          <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      )}
    </nav>
  );
}

export function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  } as const;
  return <div className={`grid gap-4 sm:gap-5 ${map[cols]}`}>{children}</div>;
}

/** Ko'rsatkichlar bloki (talabalar, o'qituvchilar...) */
export function StatsStrip({ items }: { items: Array<{ value: string; label: string; icon: IconName }> }) {
  if (items.length === 0) return null;
  return (
    <dl className="card grid grid-cols-2 gap-y-6 px-4 py-6 sm:grid-cols-4 sm:px-6">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col items-center text-center">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent">
            <Icon name={s.icon} className="h-5 w-5" />
          </span>
          <dd className="text-3xl font-bold tracking-tighter2">{s.value}</dd>
          <dt className="mt-0.5 text-[13px] font-medium text-muted">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
