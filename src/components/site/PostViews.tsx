import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { getPostBySlug, getPosts, PAGE_SIZE } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import type { Ctx } from '@/lib/ctx';
import type { PostMedia } from '@/lib/types';
import { formatDate, toEmbedUrl } from '@/lib/utils';
import Markdown from './Markdown';
import MediaGallery from './MediaGallery';
import { EmptyState, Grid, PageHeader, Pagination, PostCard } from './ui';
import ViewTracker from './ViewTracker';

type Kind = 'news' | 'announcement';

export async function PostListPage({
  ctx,
  kind,
  page,
}: {
  ctx: Ctx;
  kind: Kind;
  page: number;
}) {
  const { site, locale, dict } = ctx;
  const section = kind === 'news' ? 'news' : 'announcements';
  const { rows, total } = await getPosts({ site, kind, page });

  return (
    <>
      <PageHeader title={kind === 'news' ? dict.nav.news : dict.nav.announcements} />
      <div className="container-page py-6 sm:py-8">
        {rows.length === 0 ? (
          <EmptyState text={dict.common.noData} icon={kind === 'news' ? 'newspaper' : 'megaphone'} />
        ) : (
          <>
            <Grid>
              {rows.map((p) => (
                <PostCard key={p.id} post={p} locale={locale} dict={dict} />
              ))}
            </Grid>
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              basePath={`/${locale}/${section}`}
              dict={dict}
            />
          </>
        )}
      </div>
    </>
  );
}

export async function postMetadata(ctx: Ctx, slug: string): Promise<Metadata> {
  const data = await getPostBySlug(ctx.site, slug);
  if (!data) return {};
  const title = tr(data.post.title, ctx.locale);
  const description = tr(data.post.excerpt, ctx.locale) || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: data.post.published_at ?? undefined,
      images: data.post.cover_url ? [data.post.cover_url] : undefined,
    },
  };
}

function Attachments({ media, ctx }: { media: PostMedia[]; ctx: Ctx }) {
  const { dict } = ctx;
  const images = media.filter((m) => m.kind === 'image');
  const videos = media.filter((m) => m.kind === 'video');
  const embeds = media.filter((m) => m.kind === 'embed');
  const files = media.filter((m) => m.kind === 'file');
  if (media.length === 0) return null;

  return (
    <section className="mt-12 space-y-8 pt-8" style={{ borderTop: '0.5px solid var(--line)' }}>
      <h2 className="section-title flex items-center gap-2">
        <Icon name="paperclip" className="h-6 w-6 text-accent" />
        {dict.common.attachments}
      </h2>

      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{dict.common.photos}</h3>
          <MediaGallery images={images.map((m) => ({ url: m.url, caption: m.title }))} />
        </div>
      )}

      {(videos.length > 0 || embeds.length > 0) && (
        <div>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{dict.common.videos}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map((m) => (
              <figure key={m.id} className="card overflow-hidden">
                <video controls preload="metadata" className="aspect-video w-full bg-black" src={m.url} />
                {m.title && <figcaption className="p-3 text-sm text-muted">{m.title}</figcaption>}
              </figure>
            ))}
            {embeds.map((m) => {
              const src = toEmbedUrl(m.url);
              return (
                <figure key={m.id} className="card overflow-hidden">
                  {src ? (
                    <iframe
                      src={src}
                      title={m.title || 'Video'}
                      className="aspect-video w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="link flex items-center gap-2 p-4">
                      <Icon name="video" className="h-5 w-5" />
                      {m.title || m.url}
                    </a>
                  )}
                  {m.title && src && <figcaption className="p-3 text-sm text-muted">{m.title}</figcaption>}
                </figure>
              );
            })}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">{dict.common.files}</h3>
          <ul className="list">
            {files.map((m) => (
              <li key={m.id}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" download className="list-row">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
                    <Icon name="file" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {m.title || decodeURIComponent(m.url.split('/').pop() ?? '')}
                  </span>
                  <span className="link inline-flex shrink-0 items-center gap-1 text-sm font-medium">
                    <Icon name="download" className="h-4 w-4" />
                    {dict.common.download}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export async function PostDetailPage({ ctx, slug }: { ctx: Ctx; slug: string }) {
  const { site, locale, dict } = ctx;
  const data = await getPostBySlug(site, slug);
  if (!data) notFound();
  const { post, media } = data;
  const section = post.kind === 'announcement' ? 'announcements' : 'news';

  return (
    <article className="container-page max-w-3xl py-6 sm:py-10">
      <Link href={`/${locale}/${section}`} className="link inline-flex items-center text-[15px] font-medium">
        <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
        {post.kind === 'announcement' ? dict.nav.announcements : dict.nav.news}
      </Link>

      <h1 className="large-title mt-4">{tr(post.title, locale)}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="calendar" className="h-4 w-4" />
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="eye" className="h-4 w-4" />
          {post.view_count} {dict.common.views}
        </span>
      </p>

      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt=""
          className="mt-6 max-h-[30rem] w-full rounded-ios-lg object-cover shadow-ios"
        />
      )}

      <div className="mt-8">
        <Markdown>{tr(post.body, locale)}</Markdown>
      </div>

      <Attachments media={media} ctx={ctx} />
      <ViewTracker postId={post.id} />
    </article>
  );
}
