import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, Grid, PageHeader } from '@/components/site/ui';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getAlbums } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.nav.gallery };
}

export default async function GalleryPage({ params }: { params: SiteParams }) {
  const { site, locale, dict } = await getCtx(params);
  const albums = await getAlbums(site, 60);

  return (
    <>
      <PageHeader title={dict.nav.gallery} />
      <div className="container-page py-6 sm:py-8">
        {albums.length === 0 ? (
          <EmptyState text={dict.common.noData} icon="image" />
        ) : (
          <Grid cols={3}>
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
                <div className="p-4">
                  <h2 className="font-semibold tracking-tight">{tr(a.title, locale)}</h2>
                  <p className="mt-1 text-xs text-muted">{formatDate(a.published_at, locale)}</p>
                </div>
              </Link>
            ))}
          </Grid>
        )}
      </div>
    </>
  );
}
