import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  EmptyState,
  EventItem,
  Grid,
  PostCard,
  SectionHeading,
  StaffCard,
  StatsStrip,
} from '@/components/site/ui';
import { getCtx, type Ctx, type SiteParams } from '@/lib/ctx';
import {
  getAlbums,
  getEvents,
  getPosts,
  getPrograms,
  getSettings,
  getStaff,
} from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { siteUrl } from '@/lib/site';

export const revalidate = 60;

const HERO_IMAGE = '/images/campus.jpg';

export default async function HomePage({ params }: { params: SiteParams }) {
  const ctx = await getCtx(params);
  return ctx.site === 'talimsifati' ? <QualityHome {...ctx} /> : <MainHome {...ctx} />;
}

/** Bino rasmi ustidagi katta "hero" kartasi (iOS uslubida yumaloq burchakli) */
async function Hero({ site, locale, dict, children }: Ctx & { children?: React.ReactNode }) {
  const settings = await getSettings(site);
  const hero = settings.hero ?? {};
  const isQuality = site === 'talimsifati';
  const title = tr(hero.title, locale) || (isQuality ? dict.quality.heroTitle : dict.home.heroTitle);
  const subtitle = tr(hero.subtitle, locale) || (isQuality ? dict.quality.heroSubtitle : dict.home.heroSubtitle);
  const image = hero.image_url || HERO_IMAGE;

  return (
    <section className="container-page pt-4 sm:pt-6">
      <div className="relative isolate overflow-hidden rounded-ios-lg bg-gradient-to-br from-[#0a3a78] to-[#0a5f9c] text-white shadow-ios-lg">
        {/* Telefonda rasm butun karta ustida, kompyuterda o'ng tomonda (chap chekkasi asta so'nadi) */}
        <div
          className="absolute inset-y-0 right-0 -z-20 w-full lg:w-[64%]"
          style={{ WebkitMaskImage: 'var(--hero-mask)', maskImage: 'var(--hero-mask)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          className="absolute inset-0 -z-10 lg:hidden"
          style={{ background: 'linear-gradient(0deg, rgba(4,28,64,.92) 5%, rgba(4,28,64,.55) 55%, rgba(4,28,64,.25) 100%)' }}
        />
        <div className="px-6 pb-8 pt-40 sm:px-12 sm:pb-12 sm:pt-52 lg:max-w-[52%] lg:py-20">
          <h1 className="max-w-2xl text-[2rem] font-bold leading-[1.1] tracking-tighter2 sm:text-5xl lg:text-[3.4rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

const heroPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0a4a99] transition active:scale-[0.97] hover:bg-white/90';

async function MainHome(ctx: Ctx) {
  const { site, locale, dict } = ctx;
  const [news, announcements, events, programs, albums, settings] = await Promise.all([
    getPosts({ site, kind: 'news', limit: 6 }),
    getPosts({ site, kind: 'announcement', limit: 5 }),
    getEvents(site, 'upcoming', 4),
    getPrograms(),
    getAlbums(site, 4),
    getSettings(site),
  ]);

  const stats = settings.stats ?? {};
  const statItems = [
    stats.students && { value: `${Number(stats.students).toLocaleString('ru-RU').replace(/ /g, ' ')}+`, label: dict.home.stats.students, icon: 'users' as const },
    stats.teachers && { value: `${stats.teachers}+`, label: dict.home.stats.teachers, icon: 'user' as const },
    programs.length > 0 && { value: String(programs.length), label: dict.home.stats.programs, icon: 'graduation' as const },
    stats.founded && { value: String(stats.founded), label: dict.home.stats.founded, icon: 'building' as const },
  ].filter(Boolean) as Array<{ value: string; label: string; icon: 'users' | 'user' | 'graduation' | 'building' }>;

  return (
    <>
      <Hero {...ctx}>
        <Link href={`/${locale}/admission`} className={heroPrimary}>
          <Icon name="graduation" className="h-[18px] w-[18px]" />
          {dict.home.admissionCta}
        </Link>
        <a href={siteUrl('talimsifati', locale)} className="btn-glass">
          <Icon name="shield" className="h-[18px] w-[18px]" />
          {dict.nav.quality}
          <Icon name="arrow-up-right" className="h-4 w-4" />
        </a>
      </Hero>

      <div className="container-page space-y-12 py-10 sm:space-y-14 sm:py-12">
        <StatsStrip items={statItems} />

        <section>
          <SectionHeading title={dict.home.latestNews} href={`/${locale}/news`} hrefLabel={dict.common.all} />
          {news.rows.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="newspaper" />
          ) : (
            <Grid>
              {news.rows.map((p) => (
                <PostCard key={p.id} post={p} locale={locale} dict={dict} />
              ))}
            </Grid>
          )}
        </section>

        {programs.length > 0 && (
          <section>
            <SectionHeading title={dict.home.programs} href={`/${locale}/admission`} hrefLabel={dict.common.all} />
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {programs.map((p) => (
                <li key={p.id}>
                  <Link href={`/${locale}/admission`} className="card list-row !py-4 hover:shadow-ios-lg">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
                      <Icon name="cross" className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{tr(p.name, locale)}</span>
                      {tr(p.duration, locale) && (
                        <span className="block text-sm text-muted">{tr(p.duration, locale)}</span>
                      )}
                    </span>
                    <Icon name="chevron-right" className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <SectionHeading
              title={dict.home.latestAnnouncements}
              href={`/${locale}/announcements`}
              hrefLabel={dict.common.all}
            />
            {announcements.rows.length === 0 ? (
              <EmptyState text={dict.common.noData} icon="megaphone" />
            ) : (
              <ul className="list">
                {announcements.rows.map((p) => (
                  <li key={p.id}>
                    <Link href={`/${locale}/announcements/${p.slug}`} className="list-row">
                      <span className="flex-1 font-medium">{tr(p.title, locale)}</span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionHeading
              title={dict.home.upcomingEvents}
              href={`/${locale}/events`}
              hrefLabel={dict.common.all}
            />
            {events.length === 0 ? (
              <EmptyState text={dict.common.noData} icon="calendar" />
            ) : (
              <ul className="list">
                {events.map((e) => (
                  <EventItem key={e.id} event={e} locale={locale} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {albums.length > 0 && (
          <section>
            <SectionHeading title={dict.home.gallery} href={`/${locale}/gallery`} hrefLabel={dict.common.all} />
            <Grid cols={4}>
              {albums.map((a) => (
                <Link key={a.id} href={`/${locale}/gallery/${a.slug}`} className="card group overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-surface2">
                    {a.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.cover_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="p-4 text-[15px] font-semibold tracking-tight">{tr(a.title, locale)}</p>
                </Link>
              ))}
            </Grid>
          </section>
        )}

        <section className="relative overflow-hidden rounded-ios-lg bg-gradient-to-br from-[#0a64d6] to-[#34c759] p-7 text-white shadow-ios-lg sm:p-10">
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tighter2">{dict.nav.quality}</h2>
              <p className="mt-1.5 text-white/90">{dict.home.qualityText}</p>
            </div>
            <a href={siteUrl('talimsifati', locale)} className={`${heroPrimary} shrink-0`}>
              {dict.home.qualityCta}
              <Icon name="arrow-up-right" className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

async function QualityHome(ctx: Ctx) {
  const { site, locale, dict } = ctx;
  const [posts, staff, events, albums] = await Promise.all([
    getPosts({ site, limit: 6 }),
    getStaff(site),
    getEvents(site, 'upcoming', 4),
    getAlbums(site, 4),
  ]);

  return (
    <>
      <Hero {...ctx}>
        <Link href={`/${locale}/news`} className={heroPrimary}>
          <Icon name="newspaper" className="h-[18px] w-[18px]" />
          {dict.nav.news}
        </Link>
        <a href={siteUrl('main', locale)} className="btn-glass">
          <Icon name="building" className="h-[18px] w-[18px]" />
          {dict.nav.mainSite}
          <Icon name="arrow-up-right" className="h-4 w-4" />
        </a>
      </Hero>

      <div className="container-page space-y-12 py-10 sm:space-y-14 sm:py-12">
        <section>
          <SectionHeading title={dict.quality.latest} href={`/${locale}/news`} hrefLabel={dict.common.all} />
          {posts.rows.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="newspaper" />
          ) : (
            <Grid>
              {posts.rows.map((p) => (
                <PostCard key={p.id} post={p} locale={locale} dict={dict} />
              ))}
            </Grid>
          )}
        </section>

        {staff.length > 0 && (
          <section>
            <SectionHeading title={dict.quality.responsible} href={`/${locale}/team`} hrefLabel={dict.common.all} />
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {staff.slice(0, 4).map((s) => (
                <StaffCard key={s.id} person={s} locale={locale} dict={dict} />
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <section>
            <SectionHeading title={dict.home.upcomingEvents} href={`/${locale}/events`} hrefLabel={dict.common.all} />
            <ul className="list">
              {events.map((e) => (
                <EventItem key={e.id} event={e} locale={locale} />
              ))}
            </ul>
          </section>
        )}

        {albums.length > 0 && (
          <section>
            <SectionHeading title={dict.home.gallery} href={`/${locale}/gallery`} hrefLabel={dict.common.all} />
            <Grid cols={4}>
              {albums.map((a) => (
                <Link key={a.id} href={`/${locale}/gallery/${a.slug}`} className="card group overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-surface2">
                    {a.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <p className="p-4 text-[15px] font-semibold tracking-tight">{tr(a.title, locale)}</p>
                </Link>
              ))}
            </Grid>
          </section>
        )}
      </div>
    </>
  );
}
