import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Reveal from '@/components/site/Reveal';
import { EmptyState, PageHeader, ProgramCard } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getPrograms } from '@/lib/data';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.programs.title, description: dict.programs.subtitle };
}

export default async function ProgramsPage({ params }: { params: SiteParams }) {
  const { site, locale, dict, base } = await getCtx(params);
  if (site !== 'main') notFound();
  const programs = await getPrograms();

  return (
    <>
      <PageHeader title={dict.programs.title} subtitle={dict.programs.subtitle} />
      <div className="container-page space-y-8 py-6 sm:py-8">
        {programs.length === 0 ? (
          <EmptyState text={dict.common.noData} icon="graduation" />
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {programs.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 90} anim="up">
                <ProgramCard program={p} locale={locale} dict={dict} />
              </Reveal>
            ))}
          </div>
        )}
        <div className="flex justify-center">
          <Link href={`${base}/admission`} className="btn !px-7 !py-3.5">
            {dict.programs.apply}
            <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </>
  );
}
