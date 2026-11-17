import type { Metadata } from 'next';
import { EmptyState, EventItem, PageHeader, SectionHeading } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getEvents } from '@/lib/data';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.events.title };
}

export default async function EventsPage({ params }: { params: SiteParams }) {
  const { site, locale, dict } = await getCtx(params);
  const [upcoming, past] = await Promise.all([getEvents(site, 'upcoming', 50), getEvents(site, 'past', 12)]);

  return (
    <>
      <PageHeader title={dict.events.title} />
      <div className="container-page max-w-3xl space-y-10 py-6 sm:py-8">
        <section>
          <SectionHeading title={dict.events.upcoming} />
          {upcoming.length === 0 ? (
            <EmptyState text={dict.common.noData} icon="calendar" />
          ) : (
            <ul className="list">
              {upcoming.map((e) => (
                <EventItem key={e.id} event={e} locale={locale} />
              ))}
            </ul>
          )}
        </section>
        {past.length > 0 && (
          <section>
            <SectionHeading title={dict.events.past} />
            <ul className="list opacity-80">
              {past.map((e) => (
                <EventItem key={e.id} event={e} locale={locale} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
