import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import Reveal from '@/components/site/Reveal';
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
  getPage,
  getPosts,
  getPrograms,
  getSettings,
  getStaff,
} from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { siteUrl } from '@/lib/site';

export const revalidate = 60;

const HERO_IMAGE = '/images/campus.jpg';
const HERO_GRADIENT = 'linear-gradient(135deg,#031a30 0%,#06335a 52%,#0a5f86 100%)';

export default async function HomePage({ params }: { params: SiteParams }) {
  const ctx = await getCtx(params);
  return ctx.site === 'talimsifati' ? <QualityHome {...ctx} /> : <MainHome {...ctx} />;
}

/** Markdown matndan birinchi abzats va ro'yxat bandlarini oddiy matn ko'rinishida ajratadi */
function aboutParts(body: string): { intro: string; bullets: string[] } {
  const clean = (s: string) => s.replace(/\*\*/g, '').replace(/^[-*]\s+/, '').trim();
  const blocks = body.split(/\n\s*\n/);
  const intro = clean(blocks.find((b) => b.trim() && !b.trim().startsWith('#') && !b.trim().startsWith('-')) ?? '');
  const bullets = body
    .split('\n')
    .filter((l) => /^\s*[-*]\s+/.test(l))
    .map(clean)
    .slice(0, 4);
  return { intro, bullets };
}

function highlightLastWords(text: string, count = 2) {
  const words = text.split(' ');
  if (words.length <= count) return <span className="text-leaf">{text}</span>;
  return (
    <>
      {words.slice(0, -count).join(' ')} <span className="text-leaf">{words.slice(-count).join(' ')}</span>
    </>
  );
}

const ctaDark =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-[#04223d] transition active:scale-[0.97] hover:bg-white/90';

/** Bosh sahifa tepasidagi katta gradient "hero" */
async function Hero({
  site,
  locale,
  dict,
  badges,
  children,
}: Ctx & { badges: Array<{ icon: IconName; value: string; label: string }>; children?: React.ReactNode }) {
  const settings = await getSettings(site);
  const hero = settings.hero ?? {};
  const isQuality = site === 'talimsifati';
  const title = tr(hero.title, locale) || (isQuality ? dict.quality.heroTitle : dict.home.heroTitle);
  const subtitle = tr(hero.subtitle, locale) || (isQuality ? dict.quality.heroSubtitle : dict.home.heroSubtitle);
  const image = hero.image_url || HERO_IMAGE;

  return (
    <section className="container-page pt-3 sm:pt-4">
      <div className="relative isolate overflow-hidden rounded-ios-lg text-white shadow-ios-lg" style={{ background: HERO_GRADIENT }}>
        {/* Bezaklar: yumshoq nur va nuqtali to'r */}
        <div className="blob absolute -right-24 -top-28 -z-10 h-[26rem] w-[26rem] rounded-full bg-sky/30 blur-3xl" />
        <div className="blob absolute -bottom-32 -left-20 -z-10 h-[24rem] w-[24rem] rounded-full bg-leaf/25 blur-3xl" style={{ animationDelay: '-7s' }} />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />

        <div className="grid items-center gap-10 px-5 pb-28 pt-10 sm:px-12 sm:pt-14 lg:min-h-[640px] lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-36 lg:pt-14 2xl:px-20">
          <div>
            <span
              className="hero-left inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-bold text-leaf ring-1 ring-white/15"
              style={{ animationDelay: '60ms' }}
            >
              <span className="pulse-ring h-2 w-2 rounded-full bg-leaf" />
              {dict.home.welcome}
            </span>
            <h1 className="display hero-left mt-5" style={{ animationDelay: '160ms' }}>
              {highlightLastWords(title)}
            </h1>
            <p className="hero-in mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg" style={{ animationDelay: '320ms' }}>
              {subtitle}
            </p>
            <div className="hero-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '460ms' }}>
              {children}
            </div>
          </div>

          <div className="hero-right relative mx-auto w-full max-w-[640px] lg:max-w-none">
            <div className="relative overflow-hidden rounded-[2.2rem] ring-4 ring-white/15 shadow-ios-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="aspect-[5/4] w-full object-cover object-[45%_50%] sm:aspect-[4/3.1]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#031a30]/55 via-transparent to-transparent" />
            </div>
            {badges[0] && (
              <div className="float-a absolute -bottom-6 left-3 rounded-2xl bg-leaf px-5 py-4 text-[#04223d] shadow-glow sm:-left-6">
                <p className="text-3xl font-extrabold leading-none tracking-tighter2 sm:text-4xl">{badges[0].value}</p>
                <p className="mt-1 text-[12.5px] font-bold opacity-80">{badges[0].label}</p>
              </div>
            )}
            {badges[1] && (
              <div className="float-b glass absolute -top-5 right-3 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-ios-lg ring-1 ring-white/15 sm:-right-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky/25 text-sky">
                  <Icon name={badges[1].icon} className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-xl font-extrabold">{badges[1].value}</span>
                  <span className="block text-[12px] text-white/70">{badges[1].label}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

type QuickItem = { href: string; icon: IconName; title: string; text: string; external?: boolean };

/** Hero ostiga yarim ko'tarilib turadigan tezkor kartalar */
function QuickRow({
  image,
  imageTitle,
  imageHref,
  moreLabel,
  items,
}: {
  image: string;
  imageTitle: string;
  imageHref: string;
  moreLabel: string;
  items: QuickItem[];
}) {
  return (
    <section className="container-page relative z-10 -mt-20 sm:-mt-24 lg:-mt-28">
      <div className="grid gap-4 lg:grid-cols-[1fr_2.4fr]">
        <Reveal anim="left">
          <Link href={imageHref} className="group relative block h-full min-h-[210px] overflow-hidden rounded-ios shadow-ios-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031a30]/90 via-[#031a30]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-xl font-extrabold leading-tight tracking-tight">{imageTitle}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-leaf transition group-hover:gap-3">
                {moreLabel}
                <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.4} />
              </span>
            </div>
          </Link>
        </Reveal>

        <Reveal anim="right">
          <div className="grid h-full gap-1 rounded-ios p-2 text-white shadow-ios-lg sm:grid-cols-3" style={{ background: 'linear-gradient(135deg,#052542,#0a3c63)' }}>
            {items.map((it) => {
              const inner = (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf/20 text-leaf transition duration-300 group-hover:scale-110 group-hover:bg-leaf group-hover:text-[#04223d]">
                    <Icon name={it.icon} className="h-6 w-6" />
                  </span>
                  <span className="mt-4 flex items-center gap-1.5 text-lg font-extrabold tracking-tight">
                    {it.title}
                    <Icon name={it.external ? 'arrow-up-right' : 'arrow-right'} className="h-4 w-4 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" strokeWidth={2.4} />
                  </span>
                  <span className="mt-1.5 block text-[14px] leading-snug text-white/65">{it.text}</span>
                </>
              );
              const cls = 'group block rounded-[1.1rem] p-5 transition-colors hover:bg-white/[0.07]';
              return it.external ? (
                <a key={it.title} href={it.href} className={cls}>
                  {inner}
                </a>
              ) : (
                <Link key={it.title} href={it.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function AlbumGrid({ albums, locale }: { albums: Awaited<ReturnType<typeof getAlbums>>; locale: Ctx['locale'] }) {
  return (
    <Grid cols={4}>
      {albums.map((a, i) => (
        <Reveal key={a.id} delay={i * 90} anim="zoom">
          <Link href={`/${locale}/gallery/${a.slug}`} className="card card-hover group block overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-surface2">
              {a.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.cover_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
              )}
            </div>
            <p className="p-4 text-[15px] font-bold tracking-tight">{tr(a.title, locale)}</p>
          </Link>
        </Reveal>
      ))}
    </Grid>
  );
}

async function MainHome(ctx: Ctx) {
  const { site, locale, dict } = ctx;
  const [news, announcements, events, programs, albums, settings, about] = await Promise.all([
    getPosts({ site, kind: 'news', limit: 6 }),
    getPosts({ site, kind: 'announcement', limit: 5 }),
    getEvents(site, 'upcoming', 4),
    getPrograms(),
    getAlbums(site, 4),
    getSettings(site),
    getPage(site, 'about'),
  ]);

  const stats = settings.stats ?? {};
  const statItems = [
    stats.students && { value: String(stats.students), suffix: '+', label: dict.home.stats.students, icon: 'users' as const },
    stats.teachers && { value: String(stats.teachers), suffix: '+', label: dict.home.stats.teachers, icon: 'user' as const },
    programs.length > 0 && { value: String(programs.length), label: dict.home.stats.programs, icon: 'graduation' as const },
    stats.founded && { value: String(stats.founded), label: dict.home.stats.founded, icon: 'building' as const },
  ].filter(Boolean) as Array<{ value: string; suffix?: string; label: string; icon: IconName }>;

  const { intro, bullets } = aboutParts(tr(about?.body, locale));

  return (
    <>
      <Hero
        {...ctx}
        badges={[
          { icon: 'building', value: stats.founded ? String(stats.founded) : '1966', label: dict.home.since },
          { icon: 'graduation', value: String(programs.length || 6), label: dict.home.programsShort },
        ]}
      >
        <Link href={`/${locale}/admission`} className="btn !px-6 !py-3.5 !text-base shadow-glow">
          {dict.home.admissionCta}
          <Icon name="arrow-right" className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </Link>
        <a href={siteUrl('talimsifati', locale)} className="btn-glass !py-3.5">
          <Icon name="shield" className="h-[18px] w-[18px]" />
          {dict.nav.quality}
          <Icon name="arrow-up-right" className="h-4 w-4" />
        </a>
      </Hero>

      <QuickRow
        image="/images/import/campus-2.jpg"
        imageTitle={dict.home.cards.about}
        imageHref={`/${locale}/p/about`}
        moreLabel={dict.home.cards.more}
        items={[
          { href: `/${locale}/admission`, icon: 'graduation', title: dict.home.cards.admission, text: dict.home.cards.admissionText },
          { href: siteUrl('talimsifati', locale), icon: 'shield', title: dict.home.cards.quality, text: dict.home.cards.qualityText, external: true },
          { href: `/${locale}/gallery`, icon: 'image', title: dict.home.cards.gallery, text: dict.home.cards.galleryText },
        ]}
      />

      <div className="container-page space-y-20 py-16 sm:space-y-28 sm:py-24">
        {/* Texnikum haqida */}
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal anim="left">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/import/campus-6.jpg" alt="" loading="lazy" className="aspect-[4/3.2] w-full rounded-ios-lg object-cover shadow-ios-lg" />
              <div className="float-b absolute -bottom-5 right-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-ios-lg ring-1 ring-[var(--line)] sm:-right-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf/20 text-leaf-deep">
                  <Icon name="cross" className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="leading-tight">
                  <span className="block text-lg font-extrabold">{stats.founded ?? '1966'}</span>
                  <span className="block text-xs text-muted">{dict.home.since}</span>
                </span>
              </div>
            </div>
          </Reveal>
          <Reveal anim="right">
            <span className="badge">{dict.home.aboutBadge}</span>
            <h2 className="section-title mt-4">{dict.home.aboutTitle}</h2>
            {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted">{intro}</p>}
            {bullets.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[15px] font-semibold">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-[#04223d]">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/${locale}/p/about`}
              className="group mt-8 flex items-center justify-between gap-4 rounded-full px-5 py-3 text-white"
              style={{ background: 'linear-gradient(135deg,#052542,#0a3c63)' }}
            >
              <span className="flex items-center gap-3 text-[15px] font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf text-[#04223d]">
                  <Icon name="info" className="h-4 w-4" strokeWidth={2.2} />
                </span>
                {dict.home.aboutBadge}
              </span>
              <span className="btn !px-4 !py-1.5 !text-sm">
                {dict.home.aboutCta}
                <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.4} />
              </span>
            </Link>
          </Reveal>
        </section>

        <StatsStrip items={statItems} />

        {/* Yo'nalishlar */}
        {programs.length > 0 && (
          <section>
            <SectionHeading badge={dict.home.programsBadge} title={dict.home.programsTitle} href={`/${locale}/admission`} hrefLabel={dict.common.all} />
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {programs.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 3) * 110} anim="up">
                  <Link
                    href={`/${locale}/admission`}
                    className="group relative block h-full overflow-hidden rounded-ios p-6 text-white shadow-ios transition duration-300 hover:-translate-y-1 hover:shadow-ios-lg"
                    style={{ background: 'linear-gradient(145deg,#06335a,#0b5a7c)' }}
                  >
                    <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-leaf/15 blur-xl transition duration-500 group-hover:scale-150" />
                    <span className="relative flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-[#04223d]">
                        <Icon name="cross" className="h-6 w-6" strokeWidth={2} />
                      </span>
                      {tr(p.duration, locale) && (
                        <span className="rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-bold text-white ring-1 ring-white/15">
                          {tr(p.duration, locale)}
                        </span>
                      )}
                    </span>
                    <h3 className="relative mt-5 text-xl font-extrabold leading-snug tracking-tight">{tr(p.name, locale)}</h3>
                    {tr(p.description, locale) && (
                      <p className="relative mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-white/70">{tr(p.description, locale)}</p>
                    )}
                    <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-leaf transition group-hover:gap-3">
                      {dict.home.cards.more}
                      <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        {/* Yangiliklar */}
        <section>
          <SectionHeading badge={dict.home.mediaBadge} title={dict.home.latestNews} href={`/${locale}/news`} hrefLabel={dict.common.all} />
          {news.rows.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="newspaper" />
          ) : (
            <Grid>
              {news.rows.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 110}>
                  <PostCard post={p} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </Grid>
          )}
        </section>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
          <Reveal as="section" anim="left">
            <SectionHeading title={dict.home.latestAnnouncements} href={`/${locale}/announcements`} hrefLabel={dict.common.all} />
            {announcements.rows.length === 0 ? (
              <EmptyState text={dict.common.noData} icon="megaphone" />
            ) : (
              <ul className="list">
                {announcements.rows.map((p) => (
                  <li key={p.id}>
                    <Link href={`/${locale}/announcements/${p.slug}`} className="list-row">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent">
                        <Icon name="megaphone" className="h-5 w-5" />
                      </span>
                      <span className="flex-1 font-semibold">{tr(p.title, locale)}</span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal as="section" anim="right">
            <SectionHeading title={dict.home.upcomingEvents} href={`/${locale}/events`} hrefLabel={dict.common.all} />
            {events.length === 0 ? (
              <EmptyState text={dict.common.noData} icon="calendar" />
            ) : (
              <ul className="list">
                {events.map((e) => (
                  <EventItem key={e.id} event={e} locale={locale} />
                ))}
              </ul>
            )}
          </Reveal>
        </div>

        {albums.length > 0 && (
          <section>
            <SectionHeading badge={dict.home.gallery} title={dict.home.gallery} href={`/${locale}/gallery`} hrefLabel={dict.common.all} />
            <AlbumGrid albums={albums} locale={locale} />
          </section>
        )}

        {/* Ta'lim sifati: katta banner */}
        <Reveal anim="zoom">
          <section
            className="relative isolate overflow-hidden rounded-ios-lg p-7 text-white shadow-ios-lg sm:p-12"
            style={{ background: 'linear-gradient(120deg,#05233f 0%,#0a5f86 55%,#16a34a 135%)' }}
          >
            <div className="blob absolute -right-10 -top-20 -z-10 h-72 w-72 rounded-full bg-sky/30 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-5">
                <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-leaf text-[#04223d] sm:flex">
                  <Icon name="shield" className="h-8 w-8" strokeWidth={1.8} />
                </span>
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-extrabold tracking-tighter2 sm:text-4xl">{dict.nav.quality}</h2>
                  <p className="mt-2 text-lg text-white/85">{dict.home.qualityText}</p>
                </div>
              </div>
              <a href={siteUrl('talimsifati', locale)} className="btn shrink-0 !px-7 !py-3.5 !text-base shadow-glow">
                {dict.home.qualityCta}
                <Icon name="arrow-up-right" className="h-[18px] w-[18px]" strokeWidth={2.4} />
              </a>
            </div>
          </section>
        </Reveal>
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
      <Hero
        {...ctx}
        badges={[
          { icon: 'newspaper', value: String(posts.total), label: dict.nav.news },
          { icon: 'shield', value: dict.nav.quality.split(' ')[0], label: dict.siteShort },
        ]}
      >
        <Link href={`/${locale}/news`} className="btn !px-6 !py-3.5 !text-base shadow-glow">
          <Icon name="newspaper" className="h-[18px] w-[18px]" />
          {dict.nav.news}
        </Link>
        <a href={siteUrl('main', locale)} className="btn-glass !py-3.5">
          <Icon name="building" className="h-[18px] w-[18px]" />
          {dict.nav.mainSite}
          <Icon name="arrow-up-right" className="h-4 w-4" />
        </a>
      </Hero>

      <QuickRow
        image="/images/import/campus-2.jpg"
        imageTitle={dict.siteShort}
        imageHref={siteUrl('main', locale)}
        moreLabel={dict.nav.mainSite}
        items={[
          { href: `/${locale}/news`, icon: 'newspaper', title: dict.home.cards.news, text: dict.home.cards.newsText },
          { href: `/${locale}/team`, icon: 'users', title: dict.home.cards.team, text: dict.home.cards.teamText },
          { href: `/${locale}/gallery`, icon: 'image', title: dict.home.cards.gallery, text: dict.home.cards.galleryText },
        ]}
      />

      <div className="container-page space-y-20 py-16 sm:space-y-28 sm:py-24">
        <section>
          <SectionHeading badge={dict.nav.quality} title={dict.quality.latest} href={`/${locale}/news`} hrefLabel={dict.common.all} />
          {posts.rows.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="newspaper" />
          ) : (
            <Grid>
              {posts.rows.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 110}>
                  <PostCard post={p} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </Grid>
          )}
        </section>

        {staff.length > 0 && (
          <section>
            <SectionHeading badge={dict.nav.teamQuality} title={dict.quality.responsible} href={`/${locale}/team`} hrefLabel={dict.common.all} />
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {staff.slice(0, 4).map((s) => (
                <StaffCard key={s.id} person={s} locale={locale} dict={dict} />
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <Reveal as="section">
            <SectionHeading title={dict.home.upcomingEvents} href={`/${locale}/events`} hrefLabel={dict.common.all} />
            <ul className="list">
              {events.map((e) => (
                <EventItem key={e.id} event={e} locale={locale} />
              ))}
            </ul>
          </Reveal>
        )}

        {albums.length > 0 && (
          <section>
            <SectionHeading badge={dict.home.gallery} title={dict.home.gallery} href={`/${locale}/gallery`} hrefLabel={dict.common.all} />
            <AlbumGrid albums={albums} locale={locale} />
          </section>
        )}
      </div>
    </>
  );
}
