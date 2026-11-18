import Link from 'next/link';
import type { ReactNode } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { tr, type Locale } from '@/lib/i18n/config';
import type { Dict } from '@/lib/i18n/dictionaries';
import type { EventRow, Post, Program, Staff } from '@/lib/types';
import { highlightRegex } from '@/lib/search';
import { homeOf } from '@/lib/site';
import { formatDate, monthDay, plainText } from '@/lib/utils';
import CountUp from './CountUp';
import Reveal from './Reveal';

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
  badge,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        {badge && <span className="badge mb-3">{badge}</span>}
        <h2 className="section-title">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[14px] font-bold text-accent transition hover:gap-2.5"
        >
          {hrefLabel}
          <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}

/** Ichki sahifalar tepasidagi gradient lavha */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="container-page pt-3 sm:pt-4">
      <div
        className="relative isolate overflow-hidden rounded-ios-lg px-6 py-10 text-white sm:px-12 sm:py-14"
        style={{ background: 'linear-gradient(135deg,#031a30 0%,#06335a 55%,#0a5f86 100%)' }}
      >
        <div className="blob absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-sky/30 blur-3xl" />
        <div className="blob absolute -bottom-24 left-1/4 -z-10 h-64 w-64 rounded-full bg-leaf/25 blur-3xl" style={{ animationDelay: '-6s' }} />
        <h1 className="large-title hero-in max-w-4xl">{title}</h1>
        {subtitle && <p className="hero-in mt-3 max-w-3xl text-[17px] text-white/80" style={{ animationDelay: '120ms' }}>{subtitle}</p>}
        <span className="hero-in mt-6 block h-1.5 w-20 rounded-full bg-gradient-to-r from-sky to-leaf" style={{ animationDelay: '220ms' }} />
      </div>
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
  const href = `${homeOf(post.site, locale)}/${section}/${post.slug}`;
  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#cdeefd] to-[#d4f7df] text-accent">
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
    <li>
      <Link href={`${homeOf(event.site, locale)}/events/${event.slug || event.id}`} className="list-row !items-start">
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
          <p className="mt-1 line-clamp-2 text-sm text-muted">{plainText(tr(event.description, locale))}</p>
        )}
      </div>
      </Link>
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
  query = {},
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  dict: Dict;
  /** Sahifalashda saqlanadigan qo'shimcha parametrlar (masalan, q) */
  query?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const link = (p: number) => {
    const sp = new URLSearchParams(query);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return (basePath || '/') + (qs ? `?${qs}` : '');
  };
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

/** Ko'rsatkichlar: tepada yashil chiziq, raqamlar ekranga kirganda sanab chiqiladi */
export function StatsStrip({ items }: { items: Array<{ value: string; suffix?: string; label: string; icon: IconName }> }) {
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
      {items.map((s, i) => (
        <Reveal key={s.label} delay={i * 110}>
          <div className="border-t-[3px] pt-5" style={{ borderColor: 'var(--green)' }}>
            <dd className="flex items-baseline gap-1 text-[2.6rem] font-extrabold leading-none tracking-tighter2 sm:text-6xl">
              <CountUp value={s.value} />
              {s.suffix && <span className="text-2xl text-green sm:text-4xl">{s.suffix}</span>}
            </dd>
            <dt className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-muted">
              <Icon name={s.icon} className="h-[18px] w-[18px] text-accent" />
              {s.label}
            </dt>
          </div>
        </Reveal>
      ))}
    </dl>
  );
}

/** Qidiruv formasi (oddiy GET forma, JavaScriptsiz ham ishlaydi) */
export function SearchForm({
  action,
  q = '',
  dict,
  autoFocus = false,
  className = '',
}: {
  action: string;
  q?: string;
  dict: Dict;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form action={action || '/'} method="get" role="search" className={`flex gap-2 ${className}`}>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{dict.search.title}</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus={autoFocus}
          maxLength={80}
          placeholder={dict.search.placeholder}
          className="w-full rounded-full bg-surface py-3 pl-12 pr-4 text-[16px] shadow-ios outline-none ring-1 ring-[var(--line)] focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>
      <button type="submit" className="btn !px-6">
        {dict.search.button}
      </button>
    </form>
  );
}

/** Topilgan so'zlarni belgilab ko'rsatadi */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const re = highlightRegex(terms);
  if (!re || !text) return <>{text}</>;
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-leaf/35 px-0.5 text-inherit">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** Yo'nalish kartochkasi (batafsil sahifaga havola) */
export function ProgramCard({ program: p, locale, dict }: { program: Program; locale: Locale; dict: Dict }) {
  const href = `${homeOf('main', locale)}/programs/${p.slug}`;
  return (
    <article className="card card-hover group relative p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
          <Icon name="cross" className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug tracking-tight">
            <Link href={href} className="after:absolute after:inset-0 hover:text-accent">
              {tr(p.name, locale)}
            </Link>
          </h3>
          {tr(p.description, locale) && (
            <p className="mt-1.5 line-clamp-3 text-[15px] leading-relaxed text-muted">{tr(p.description, locale)}</p>
          )}
        </div>
      </div>
      <dl className="mt-5 flex flex-wrap gap-2 text-sm">
        {tr(p.duration, locale) && (
          <div className="chip" title={dict.admission.duration}>
            <Icon name="clock" className="h-3.5 w-3.5" />
            <dt className="sr-only">{dict.admission.duration}</dt>
            <dd>{tr(p.duration, locale)}</dd>
          </div>
        )}
        {tr(p.study_form, locale) && (
          <div className="chip" title={dict.admission.form}>
            <Icon name="book" className="h-3.5 w-3.5" />
            <dt className="sr-only">{dict.admission.form}</dt>
            <dd>{tr(p.study_form, locale)}</dd>
          </div>
        )}
        {tr(p.language, locale) && (
          <div className="chip" title={dict.admission.language}>
            <Icon name="globe" className="h-3.5 w-3.5" />
            <dt className="sr-only">{dict.admission.language}</dt>
            <dd>{tr(p.language, locale)}</dd>
          </div>
        )}
        {p.quota != null && (
          <div className="chip" title={dict.admission.quota}>
            <Icon name="users" className="h-3.5 w-3.5" />
            <dt className="sr-only">{dict.admission.quota}</dt>
            <dd>{p.quota}</dd>
          </div>
        )}
      </dl>
      <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-accent">
        {dict.programs.details}
        <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </article>
  );
}
