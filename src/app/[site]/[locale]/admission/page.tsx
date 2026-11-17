import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/site/Markdown';
import { EmptyState, PageHeader, SectionHeading } from '@/components/site/ui';
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
                <article key={p.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
                      <Icon name="cross" className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold leading-snug tracking-tight">{tr(p.name, locale)}</h3>
                      {tr(p.description, locale) && (
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{tr(p.description, locale)}</p>
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
                </article>
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
