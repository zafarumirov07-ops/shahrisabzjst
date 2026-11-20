import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Carousel from '@/components/site/Carousel';
import Markdown from '@/components/site/Markdown';
import Reveal from '@/components/site/Reveal';
import { PageHeader, SectionHeading } from '@/components/site/ui';
import { getCtx, type Ctx } from '@/lib/ctx';
import { getPage, getRecentPhotos, getSettings } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import type { Page } from '@/lib/types';

type Params = Promise<{ site: string; locale: string; slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const { site, locale } = await getCtx(Promise.resolve(p));
  const page = await getPage(site, decodeURIComponent(p.slug));
  return page ? { title: tr(page.title, locale) } : {};
}

/** Statik sahifalar: /p/about, /p/contact va h.k. Admin paneldagi "Sahifalar" bo'limidan boshqariladi. */
export default async function StaticPage({ params }: { params: Params }) {
  const p = await params;
  const ctx = await getCtx(Promise.resolve(p));
  const page = await getPage(ctx.site, decodeURIComponent(p.slug));
  if (!page) notFound();

  if (page.slug === 'about') return <AboutPage ctx={ctx} page={page} />;

  return (
    <>
      <PageHeader title={tr(page.title, ctx.locale)} />
      <div className="container-page max-w-3xl py-6 sm:py-8">
        <div className="card p-6 sm:p-10">
          <Markdown>{tr(page.body, ctx.locale)}</Markdown>
        </div>
      </div>
    </>
  );
}

/** "Texnikum haqida": matn yonida bino rasmlari, pastda galereyadan so'nggi suratlar */
async function AboutPage({ ctx, page }: { ctx: Ctx; page: Page }) {
  const { site, locale, dict, base } = ctx;
  const [settings, photos] = await Promise.all([getSettings(site), getRecentPhotos(site, 12)]);
  const title = tr(page.title, locale);
  const founded = settings.stats?.founded ? String(settings.stats.founded) : '1966';

  return (
    <>
      <PageHeader title={title} />
      <div className="container-page py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <Reveal anim="left">
            <div className="card h-full p-6 sm:p-10">
              <Markdown>{tr(page.body, locale)}</Markdown>
            </div>
          </Reveal>

          <Reveal anim="right">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <figure className="relative col-span-2 overflow-hidden rounded-ios shadow-ios-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/import/campus-6.jpg" alt={title} className="aspect-[16/10] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--shade-rgb)/0.45)] via-transparent to-transparent" />
                <figcaption className="absolute bottom-3 left-3 flex items-center gap-3 rounded-2xl bg-surface px-4 py-2.5 shadow-ios-lg sm:bottom-4 sm:left-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf/20 text-leaf-deep">
                    <Icon name="building" className="h-5 w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-lg font-extrabold">{founded}</span>
                    <span className="block text-xs text-muted">{dict.home.since}</span>
                  </span>
                </figcaption>
              </figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/import/campus-1.jpg" alt="" loading="lazy" className="aspect-[4/3] w-full rounded-ios object-cover shadow-ios" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/import/campus-3.jpg" alt="" loading="lazy" className="aspect-[4/3] w-full rounded-ios object-cover object-top shadow-ios" />
            </div>
          </Reveal>
        </div>

        {photos.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <SectionHeading badge={dict.home.gallery} title={dict.home.gallery} href={`${base}/gallery`} hrefLabel={dict.common.all} />
            <Carousel
              label={dict.home.gallery}
              items={photos.map((ph) => ({ url: ph.url, caption: tr(ph.caption, locale), href: `${base}/gallery/${ph.albumSlug}` }))}
              slideClass="basis-full sm:basis-1/2 lg:basis-1/3"
              aspect="aspect-[4/3]"
            />
          </section>
        )}
      </div>
    </>
  );
}
