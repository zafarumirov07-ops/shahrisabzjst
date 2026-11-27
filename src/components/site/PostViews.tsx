import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { getPostBySlug, getPostExtras, getPosts, PAGE_SIZE, searchContent } from '@/lib/data';
import { tr } from '@/lib/i18n/config';
import type { Ctx } from '@/lib/ctx';
import { POST_ICON, POST_SECTION, postKindLabel } from '@/lib/post-kinds';
import type { Post, PostKind, PostMedia, SearchHit } from '@/lib/types';
import { formatDate, toEmbedUrl } from '@/lib/utils';
import Markdown from './Markdown';
import MediaGallery from './MediaGallery';
import { EmptyState, Grid, PageHeader, Pagination, PostCard, ResourceCard, SearchForm, safeExternalUrl } from './ui';
import ViewTracker from './ViewTracker';

type Kind = PostKind;

const externalHref = safeExternalUrl;

/** Qidiruv natijalarini PostCard ko'rsatadigan Post shakliga keltiradi */
async function searchPosts(site: Ctx['site'], kind: Kind, q: string, page: number): Promise<{ rows: Post[]; total: number }> {
  const { rows, total } = await searchContent({ site, q, types: [kind], page, limit: PAGE_SIZE });
  const posts = rows.map(
    (h: SearchHit) =>
      ({
        id: h.id,
        site,
        kind,
        slug: h.slug,
        title: h.title,
        excerpt: h.snippet,
        body: {},
        cover_url: h.cover_url,
        published_at: h.at,
        pinned: false,
        view_count: 0,
      }) as unknown as Post,
  );
  // Qidiruv natijasida o'qituvchi/muallif va havola yo'q: ularni alohida olamiz
  const extras = await getPostExtras(posts.map((x) => x.id));
  for (const x of posts) Object.assign(x, extras[x.id] ?? {});
  return { rows: posts, total };
}

export async function PostListPage({
  ctx,
  kind,
  page,
  q = '',
}: {
  ctx: Ctx;
  kind: Kind;
  page: number;
  q?: string;
}) {
  const { site, locale, dict, base } = ctx;
  const section = POST_SECTION[kind];
  const query = q.trim().slice(0, 80);
  const { rows, total } = query
    ? await searchPosts(site, kind, query, page)
    : await getPosts({ site, kind, page });

  return (
    <>
      <PageHeader title={postKindLabel(kind, dict)} />
      <div className="container-page py-6 sm:py-8">
        <SearchForm action={`${base}/${section}`} q={query} dict={dict} className="mb-6 max-w-2xl" />
        {rows.length === 0 ? (
          <EmptyState text={query ? dict.search.none : dict.common.noData} icon={POST_ICON[kind]} />
        ) : (
          <>
            <Grid>
              {rows.map((p) =>
                kind === 'resource' ? (
                  <ResourceCard key={p.id} post={p} locale={locale} dict={dict} />
                ) : (
                  <PostCard key={p.id} post={p} locale={locale} dict={dict} />
                ),
              )}
            </Grid>
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              basePath={`${base}/${section}`}
              dict={dict}
              query={query ? { q: query } : {}}
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

/** kinds: bu manzilda ochilishi mumkin bo'lgan post turlari (boshqa turdagi post bu yerda 404 beradi) */
export async function PostDetailPage({ ctx, slug, kinds }: { ctx: Ctx; slug: string; kinds: PostKind[] }) {
  const { site, locale, dict, base } = ctx;
  const data = await getPostBySlug(site, slug);
  if (!data || !kinds.includes(data.post.kind)) notFound();
  const { post, media } = data;
  const section = POST_SECTION[post.kind];

  return (
    <article className="container-page max-w-3xl py-6 sm:py-10">
      <Link href={`${base}/${section}`} className="link inline-flex items-center text-[15px] font-medium">
        <Icon name="chevron-left" className="h-5 w-5" strokeWidth={2.2} />
        {postKindLabel(post.kind, dict)}
      </Link>

      <h1 className="large-title mt-4">{tr(post.title, locale)}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        {post.author && (
          <span className="inline-flex items-center gap-1.5 font-medium text-fg">
            <Icon name="user" className="h-4 w-4" />
            {post.kind === 'resource' ? dict.common.teacher : dict.common.author}: {post.author}
          </span>
        )}
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

      {externalHref(post.external_url) && (
        <a
          href={externalHref(post.external_url)!}
          target="_blank"
          rel="noopener noreferrer"
          className="btn mt-6 inline-flex"
        >
          {dict.common.openResource}
          <Icon name="arrow-up-right" className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </a>
      )}

      <div className="mt-8">
        <Markdown>{tr(post.body, locale)}</Markdown>
      </div>

      <Attachments media={media} ctx={ctx} />
      <ViewTracker postId={post.id} />
    </article>
  );
}
