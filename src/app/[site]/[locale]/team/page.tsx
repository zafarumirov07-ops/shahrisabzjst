import type { Metadata } from 'next';
import { EmptyState, PageHeader, SectionHeading, StaffCard } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getStaff } from '@/lib/data';
import type { Staff } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { site, dict } = await getCtx(params);
  return { title: site === 'talimsifati' ? dict.nav.teamQuality : dict.nav.team };
}

const GROUP_ORDER: Staff['group_key'][] = ['leadership', 'responsible', 'teacher', 'staff'];

export default async function TeamPage({ params }: { params: SiteParams }) {
  const { site, locale, dict } = await getCtx(params);
  const staff = await getStaff(site);

  const groups = GROUP_ORDER.map((key) => ({
    key,
    label: dict.team[key],
    people: staff.filter((s) => s.group_key === key),
  })).filter((g) => g.people.length > 0);

  return (
    <>
      <PageHeader title={site === 'talimsifati' ? dict.nav.teamQuality : dict.team.title} />
      <div className="container-page space-y-12 py-6 sm:py-8">
        {groups.length === 0 ? (
          <EmptyState text={dict.common.noData} icon="users" />
        ) : (
          groups.map((g) => (
            <section key={g.key}>
              <SectionHeading title={g.label} />
              <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {g.people.map((p) => (
                  <StaffCard key={p.id} person={p} locale={locale} dict={dict} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
