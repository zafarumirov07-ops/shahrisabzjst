/**
 * Demo rejim (NEXT_PUBLIC_DEMO=1): Supabase ulanmagan holatda ham saytni eski saytdan
 * ko'chirilgan ma'lumotlar bilan ko'rish uchun. Ishlab chiqarishda ishlatilmaydi.
 */
import seed from '../../supabase/seed/kasbedu.json';
import type { Site } from '@/lib/site';
import type { Album, AlbumItem, EventRow, Page, Post, Program, SiteSettings, Staff, Department } from '@/lib/types';

export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

type Seed = typeof seed;
const data = seed as Seed;

const i18n = (v: unknown) => (v ?? {}) as Record<string, string>;

export const demoPosts: Post[] = data.posts.map((p, i) => ({
  id: `demo-post-${i}`,
  site: p.site as Site,
  kind: p.kind as 'news' | 'announcement',
  slug: p.slug,
  status: 'published',
  published_at: p.published_at,
  title: i18n(p.title),
  excerpt: i18n(p.excerpt),
  body: i18n(p.body),
  cover_url: p.cover_url ?? null,
  category_id: null,
  pinned: false,
  view_count: 0,
}));

export const demoPages: Page[] = data.pages.map((p, i) => ({
  id: `demo-page-${i}`,
  site: p.site as Site,
  slug: p.slug,
  title: i18n(p.title),
  body: i18n(p.body),
  published: true,
}));

export const demoPrograms: Program[] = data.programs.map((p, i) => {
  const d = p as { description?: unknown; duration?: unknown };
  return {
    id: `demo-program-${i}`,
    slug: p.slug,
    name: i18n(p.name),
    description: i18n(d.description ?? data.programDefaults.description),
    duration: i18n(d.duration ?? data.programDefaults.duration),
    study_form: {},
    language: {},
    quota: null,
    sort_order: p.sort_order,
  };
});

export const demoAlbums: Album[] = data.albums.map((a, i) => ({
  id: `demo-album-${i}`,
  site: a.site as Site,
  slug: a.slug,
  title: i18n(a.title),
  description: i18n(a.description),
  cover_url: a.cover_url ?? null,
  published_at: a.published_at,
}));

export const demoAlbumItems: AlbumItem[] = data.albums.flatMap((a, ai) =>
  a.items.map((it, i) => ({
    id: `demo-item-${ai}-${i}`,
    album_id: `demo-album-${ai}`,
    kind: it.kind as 'image',
    url: it.url,
    caption: null,
    sort_order: i,
  })),
);

export const demoSettings = (site: Site): SiteSettings =>
  ((data.settings as Record<string, unknown>)[site] ?? {}) as SiteSettings;

export const demoStaff: Staff[] = [];
export const demoDepartments: Department[] = [];
export const demoEvents: EventRow[] = [];
