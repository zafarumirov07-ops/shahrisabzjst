import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import Markdown from '@/components/site/Markdown';
import { PageHeader } from '@/components/site/ui';
import { getCtx } from '@/lib/ctx';
import { getProgramBySlug } from '@/lib/data';
import { tr } from '@/lib/i18n/config';

type Params = Promise<{ site: string; locale: string; slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const { locale } = await getCtx(Promise.resolve(p));
  const program = await getProgramBySlug(decodeURIComponent(p.slug));
  if (!program) return {};
  const title = tr(program.name, locale);
  const description = tr(program.description, locale) || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: program.cover_url ? [program.cover_url] : undefined },
  };
}

export default async function ProgramPage({ params }: { params: Params }) {
  const p = await params;
  const { site, locale, dict, base } = await getCtx(Promise.resolve(p));
  if (site !== 'main') notFound();
  const program = await getProgramBySlug(decodeURIComponent(p.slug));
  if (!program) notFound();

  const facts: Array<{ icon: 'clock' | 'book' | 'globe' | 'users'; label: string; value: string }> = [];
  if (tr(program.duration, locale)) facts.push({ icon: 'clock', label: dict.admission.duration, value: tr(program.duration, locale) });
  if (tr(program.study_form, locale)) facts.push({ icon: 'book', label: dict.admission.form, value: tr(program.study_form, locale) });
  if (tr(program.language, locale)) facts.push({ icon: 'globe', label: dict.admission.language, value: tr(program.language, locale) });
  if (program.quota != null) facts.push({ icon: 'users', label: dict.admission.quota, value: String(program.quota) });

  const description = tr(program.description, locale);
  const body = tr(program.body, locale);

  return (
    <>
      <PageHeader title={tr(program.name, locale)} subtitle={description || undefined} />
      <div className="container-page max-w-4xl space-y-8 py-6 sm:py-8">
        <Link href={`${base}/programs`} className="link inline-flex items-center text-[15px] font-medium">
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {dict.programs.title}
        </Link>

        {program.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={program.cover_url} alt="" className="max-h-[26rem] w-full rounded-ios-lg object-cover shadow-ios" />
        )}

        {facts.length > 0 && (
          <section aria-label={dict.programs.info}>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="card flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[13px] font-medium text-muted">{f.label}</dt>
                    <dd className="font-semibold leading-snug">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
        )}

        {body ? (
          <section className="card p-6 sm:p-8">
            <h2 className="section-title mb-4">{dict.programs.about}</h2>
            <Markdown>{body}</Markdown>
          </section>
        ) : description ? (
          <section className="card p-6 sm:p-8">
            <h2 className="section-title mb-3">{dict.programs.about}</h2>
            <p className="text-[16px] leading-relaxed">{description}</p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link href={`${base}/admission`} className="btn !px-6 !py-3">
            {dict.programs.apply}
            <Icon name="arrow-right" className="h-4 w-4" strokeWidth={2.4} />
          </Link>
          <Link href={`${base}/contact`} className="btn-outline !px-6 !py-3">
            {dict.home.contactCta}
          </Link>
        </div>
      </div>
    </>
  );
}
