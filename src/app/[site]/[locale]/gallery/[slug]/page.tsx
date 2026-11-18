import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import MediaGallery from '@/components/site/MediaGallery';
import { PageHeader } from '@/components/site/ui';
import { getCtx } from '@/lib/ctx';
import { getAlbum } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import { toEmbedUrl } from '@/lib/utils';

type Params = Promise<{ site: string; locale: string; slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const { site, locale } = await getCtx(Promise.resolve(p));
  const data = await getAlbum(site, decodeURIComponent(p.slug));
  return data ? { title: tr(data.album.title, locale) } : {};
}

export default async function AlbumPage({ params }: { params: Params }) {
  const p = await params;
  const { site, locale, dict, base } = await getCtx(Promise.resolve(p));
  const data = await getAlbum(site, decodeURIComponent(p.slug));
  if (!data) notFound();

  const { album, items } = data;
  const images = items.filter((i) => i.kind === 'image').map((i) => ({ url: i.url, caption: i.caption }));
  const videos = items.filter((i) => i.kind === 'video');
  const embeds = items.filter((i) => i.kind === 'embed');

  return (
    <>
      <PageHeader title={tr(album.title, locale)} subtitle={tr(album.description, locale)} />
      <div className="container-page space-y-10 py-6 sm:py-8">
        <Link href={`${base}/gallery`} className="link inline-flex items-center text-[15px] font-medium">
          <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
          {dict.nav.gallery}
        </Link>

        <MediaGallery images={images} carousel label={tr(album.title, locale)} />

        {(videos.length > 0 || embeds.length > 0) && (
          <section>
            <h2 className="mb-4 text-xl font-bold">{dict.common.videos}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((v) => (
                <figure key={v.id} className="card overflow-hidden">
                  <video controls preload="metadata" src={v.url} className="aspect-video w-full bg-black" />
                  {v.caption && <figcaption className="p-3 text-sm text-muted">{v.caption}</figcaption>}
                </figure>
              ))}
              {embeds.map((v) => {
                const src = toEmbedUrl(v.url);
                return (
                  <figure key={v.id} className="card overflow-hidden">
                    {src ? (
                      <iframe
                        src={src}
                        title={v.caption || 'Video'}
                        loading="lazy"
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="link block p-4">
                        {v.caption || v.url}
                      </a>
                    )}
                  </figure>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
