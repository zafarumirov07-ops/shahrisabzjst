import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Markdown from '@/components/site/Markdown';
import { PageHeader } from '@/components/site/ui';
import { getCtx } from '@/lib/ctx';
import { getPage } from '@/lib/data';
import { tr } from '@/lib/i18n/config';

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
  const { site, locale } = await getCtx(Promise.resolve(p));
  const page = await getPage(site, decodeURIComponent(p.slug));
  if (!page) notFound();

  return (
    <>
      <PageHeader title={tr(page.title, locale)} />
      <div className="container-page max-w-3xl py-6 sm:py-8">
        <div className="card p-6 sm:p-10">
          <Markdown>{tr(page.body, locale)}</Markdown>
        </div>
      </div>
    </>
  );
}
