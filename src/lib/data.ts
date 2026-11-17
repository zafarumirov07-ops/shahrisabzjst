import {
  DEMO,
  demoAlbumItems,
  demoAlbums,
  demoDepartments,
  demoEvents,
  demoPages,
  demoPosts,
  demoPrograms,
  demoSettings,
  demoStaff,
} from '@/lib/demo';
import { createPublicClient } from '@/lib/supabase/public';
import type { Site } from '@/lib/site';
import type {
  Album,
  AlbumItem,
  Department,
  EventRow,
  Page,
  Post,
  PostMedia,
  Program,
  SiteSettings,
  Staff,
} from '@/lib/types';

export const PAGE_SIZE = 9;

/** Supabase xatosi yoki sozlanmagan holatda sayt yiqilmasligi uchun. */
async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error('[data]', err);
    return fallback;
  }
}

const nowIso = () => new Date().toISOString();

export async function getPosts(opts: {
  site: Site;
  kind?: 'news' | 'announcement';
  limit?: number;
  page?: number;
}): Promise<{ rows: Post[]; total: number }> {
  return safe({ rows: [], total: 0 }, async () => {
    const limit = opts.limit ?? PAGE_SIZE;
    const from = ((opts.page ?? 1) - 1) * limit;
    if (DEMO) {
      const all = demoPosts
        .filter((p) => p.site === opts.site && (!opts.kind || p.kind === opts.kind))
        .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
      return { rows: all.slice(from, from + limit), total: all.length };
    }
    const db = createPublicClient();
    if (!db) return { rows: [], total: 0 };
    let q = db
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('site', opts.site)
      .eq('status', 'published')
      .lte('published_at', nowIso())
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(from, from + limit - 1);
    if (opts.kind) q = q.eq('kind', opts.kind);
    const { data, count, error } = await q;
    if (error) throw error;
    return { rows: (data ?? []) as Post[], total: count ?? 0 };
  });
}

export async function getPostBySlug(
  site: Site,
  slug: string,
): Promise<{ post: Post; media: PostMedia[] } | null> {
  return safe(null, async () => {
    if (DEMO) {
      const post = demoPosts.find((p) => p.site === site && p.slug === slug);
      return post ? { post, media: [] } : null;
    }
    const db = createPublicClient();
    if (!db) return null;
    const { data, error } = await db
      .from('posts')
      .select('*')
      .eq('site', site)
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', nowIso())
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: media } = await db
      .from('post_media')
      .select('*')
      .eq('post_id', data.id)
      .order('sort_order', { ascending: true });
    return { post: data as Post, media: (media ?? []) as PostMedia[] };
  });
}

export async function getPage(site: Site, slug: string): Promise<Page | null> {
  return safe(null, async () => {
    if (DEMO) return demoPages.find((p) => p.site === site && p.slug === slug) ?? null;
    const db = createPublicClient();
    if (!db) return null;
    const { data } = await db
      .from('pages')
      .select('*')
      .eq('site', site)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    return (data as Page) ?? null;
  });
}

export async function getPages(site: Site): Promise<Page[]> {
  return safe([], async () => {
    if (DEMO) return demoPages.filter((p) => p.site === site);
    const db = createPublicClient();
    if (!db) return [];
    const { data } = await db
      .from('pages')
      .select('*')
      .eq('site', site)
      .eq('published', true)
      .order('sort_order', { ascending: true });
    return (data ?? []) as Page[];
  });
}

export async function getStaff(site: Site): Promise<Staff[]> {
  return safe([], async () => {
    if (DEMO) return demoStaff.filter((s) => s.site === site);
    const db = createPublicClient();
    if (!db) return [];
    const { data } = await db
      .from('staff')
      .select('*')
      .eq('site', site)
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('full_name', { ascending: true });
    return (data ?? []) as Staff[];
  });
}

export async function getDepartments(): Promise<Department[]> {
  return safe([], async () => {
    if (DEMO) return demoDepartments;
    const db = createPublicClient();
    if (!db) return [];
    const { data } = await db.from('departments').select('*').order('sort_order', { ascending: true });
    return (data ?? []) as Department[];
  });
}

export async function getPrograms(): Promise<Program[]> {
  return safe([], async () => {
    if (DEMO) return demoPrograms;
    const db = createPublicClient();
    if (!db) return [];
    const { data } = await db
      .from('programs')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    return (data ?? []) as Program[];
  });
}

export async function getEvents(
  site: Site,
  when: 'upcoming' | 'past',
  limit = 20,
): Promise<EventRow[]> {
  return safe([], async () => {
    if (DEMO) return demoEvents.filter((e) => e.site === site);
    const db = createPublicClient();
    if (!db) return [];
    // Bugungi kun boshidan boshlab "yaqinlashayotgan" hisoblanadi
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let q = db.from('events').select('*').eq('site', site).eq('published', true).limit(limit);
    q =
      when === 'upcoming'
        ? q.gte('starts_at', startOfToday.toISOString()).order('starts_at', { ascending: true })
        : q.lt('starts_at', startOfToday.toISOString()).order('starts_at', { ascending: false });
    const { data } = await q;
    return (data ?? []) as EventRow[];
  });
}

export async function getAlbums(site: Site, limit = 24): Promise<Album[]> {
  return safe([], async () => {
    if (DEMO) return demoAlbums.filter((a) => a.site === site).slice(0, limit);
    const db = createPublicClient();
    if (!db) return [];
    const { data } = await db
      .from('albums')
      .select('*')
      .eq('site', site)
      .eq('published', true)
      .lte('published_at', nowIso())
      .order('published_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as Album[];
  });
}

export async function getAlbum(
  site: Site,
  slug: string,
): Promise<{ album: Album; items: AlbumItem[] } | null> {
  return safe(null, async () => {
    if (DEMO) {
      const album = demoAlbums.find((a) => a.site === site && a.slug === slug);
      return album ? { album, items: demoAlbumItems.filter((i) => i.album_id === album.id) } : null;
    }
    const db = createPublicClient();
    if (!db) return null;
    const { data } = await db
      .from('albums')
      .select('*')
      .eq('site', site)
      .eq('slug', slug)
      .eq('published', true)
      .lte('published_at', nowIso())
      .maybeSingle();
    if (!data) return null;
    const { data: items } = await db
      .from('album_items')
      .select('*')
      .eq('album_id', data.id)
      .order('sort_order', { ascending: true });
    return { album: data as Album, items: (items ?? []) as AlbumItem[] };
  });
}

export async function getSettings(site: Site): Promise<SiteSettings> {
  return safe({}, async () => {
    if (DEMO) return demoSettings(site);
    const db = createPublicClient();
    if (!db) return {};
    const { data } = await db.from('site_settings').select('key, value').eq('site', site);
    const out: Record<string, unknown> = {};
    for (const row of data ?? []) out[row.key as string] = row.value;
    return out as SiteSettings;
  });
}
