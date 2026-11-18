import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/site/Markdown';
import { EmptyState, PageHeader, ProgramCard, SectionHeading } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getPage, getPrograms } from '@/lib/data';
import { tr } from '@/lib/i18n/config';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.admission.title };
}

export default async function AdmissionPage({ params }: { params: SiteParams }) {
  const { site, locale, dict } = await getCtx(params);
  if (site !== 'main') notFound();

  const [programs, rules] = await Promise.all([getPrograms(), getPage('main', 'admission')]);

  return (
    <>
      <PageHeader title={dict.admission.title} />
      <div className="container-page space-y-12 py-6 sm:py-8">
        <section>
          <SectionHeading title={dict.admission.programs} />
          {programs.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="graduation" />
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {programs.map((p) => (
                <ProgramCard key={p.id} program={p} locale={locale} dict={dict} />
              ))}
            </div>
          )}
        </section>

        {rules && tr(rules.body, locale) && (
          <section>
            <SectionHeading title={tr(rules.title, locale) || dict.admission.rules} />
            <div className="card p-6 sm:p-8">
              <Markdown>{tr(rules.body, locale)}</Markdown>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
