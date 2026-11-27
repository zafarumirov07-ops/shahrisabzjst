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
  PostKind,
  PostMedia,
  Program,
  RecentPhoto,
  SearchHit,
  SearchType,
  SiteSettings,
  Staff,
} from '@/lib/types';

import { searchTerms } from '@/lib/search';

export const PAGE_SIZE = 9;
export const ALBUM_PAGE_SIZE = 12;

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
  kind?: PostKind;
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

/** Qidiruv natijalari uchun: post id -> muallif va tashqi havola */
export async function getPostExtras(
  ids: string[],
): Promise<Record<string, { author: string | null; external_url: string | null }>> {
  return safe({}, async () => {
    if (DEMO || ids.length === 0) return {};
    const db = createPublicClient();
    if (!db) return {};
    const { data, error } = await db.from('posts').select('id, author, external_url').in('id', ids);
    if (error) throw error;
    return Object.fromEntries(
      (data ?? []).map((r) => [r.id as string, { author: (r.author as string) ?? null, external_url: (r.external_url as string) ?? null }]),
    );
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


export async function getAlbumsPage(opts: {
  site: Site;
  page?: number;
  limit?: number;
}): Promise<{ rows: Album[]; total: number }> {
  return safe({ rows: [], total: 0 }, async () => {
    const limit = opts.limit ?? ALBUM_PAGE_SIZE;
    const from = ((opts.page ?? 1) - 1) * limit;
    if (DEMO) {
      const all = demoAlbums.filter((a) => a.site === opts.site);
      return { rows: all.slice(from, from + limit), total: all.length };
    }
    const db = createPublicClient();
    if (!db) return { rows: [], total: 0 };
    const { data, count, error } = await db
      .from('albums')
      .select('*', { count: 'exact' })
      .eq('site', opts.site)
      .eq('published', true)
      .lte('published_at', nowIso())
      .order('published_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw error;
    return { rows: (data ?? []) as Album[], total: count ?? 0 };
  });
}

/** Bosh sahifa karuseli uchun: eng yangi albomlardan bir nechtadan rasm */
export async function getRecentPhotos(site: Site, limit = 18, perAlbum = 3): Promise<RecentPhoto[]> {
  return safe([], async () => {
    if (DEMO) return [];
    const db = createPublicClient();
    if (!db) return [];
    const { data: albums } = await db
      .from('albums')
      .select('id, slug, title')
      .eq('site', site)
      .eq('published', true)
      .lte('published_at', nowIso())
      .order('published_at', { ascending: false })
      .limit(Math.ceil(limit / perAlbum) + 2);
    if (!albums?.length) return [];
    const { data: items } = await db
      .from('album_items')
      .select('album_id, url, sort_order')
      .in('album_id', albums.map((a) => a.id))
      .eq('kind', 'image')
      .order('sort_order', { ascending: true });
    const out: RecentPhoto[] = [];
    for (const a of albums) {
      const mine = (items ?? []).filter((i) => i.album_id === a.id).slice(0, perAlbum);
      for (const i of mine) out.push({ url: i.url as string, caption: a.title as RecentPhoto['caption'], albumSlug: a.slug as string });
    }
    return out.slice(0, limit);
  });
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  return safe(null, async () => {
    if (DEMO) return demoPrograms.find((p) => p.slug === slug) ?? null;
    const db = createPublicClient();
    if (!db) return null;
    const { data } = await db.from('programs').select('*').eq('slug', slug).eq('published', true).maybeSingle();
    return (data as Program) ?? null;
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tadbir: slug bo'yicha, slug bo'lmagan eski yozuvlar uchun id bo'yicha */
export async function getEventByKey(site: Site, key: string): Promise<EventRow | null> {
  return safe(null, async () => {
    if (DEMO) return demoEvents.find((e) => e.site === site && (e.id === key || e.slug === key)) ?? null;
    const db = createPublicClient();
    if (!db) return null;
    const q = db.from('events').select('*').eq('site', site).eq('published', true);
    const { data } = await (UUID.test(key) ? q.eq('id', key) : q.eq('slug', key)).maybeSingle();
    return (data as EventRow) ?? null;
  });
}

export async function getEventsPage(opts: {
  site: Site;
  when: 'upcoming' | 'past';
  page?: number;
  limit?: number;
}): Promise<{ rows: EventRow[]; total: number }> {
  return safe({ rows: [], total: 0 }, async () => {
    const limit = opts.limit ?? PAGE_SIZE;
    const from = ((opts.page ?? 1) - 1) * limit;
    if (DEMO) return { rows: [], total: 0 };
    const db = createPublicClient();
    if (!db) return { rows: [], total: 0 };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let q = db.from('events').select('*', { count: 'exact' }).eq('site', opts.site).eq('published', true);
    q =
      opts.when === 'upcoming'
        ? q.gte('starts_at', startOfToday.toISOString()).order('starts_at', { ascending: true })
        : q.lt('starts_at', startOfToday.toISOString()).order('starts_at', { ascending: false });
    const { data, count, error } = await q.range(from, from + limit - 1);
    if (error) throw error;
    return { rows: (data ?? []) as EventRow[], total: count ?? 0 };
  });
}

/** Sayt bo'yicha qidiruv (migratsiyadagi search_content funksiyasi). */
export async function searchContent(opts: {
  site: Site;
  q: string;
  types?: SearchType[];
  page?: number;
  limit?: number;
}): Promise<{ rows: SearchHit[]; total: number }> {
  return safe({ rows: [], total: 0 }, async () => {
    const terms = searchTerms(opts.q);
    if (terms.length === 0 || DEMO) return { rows: [], total: 0 };
    const db = createPublicClient();
    if (!db) return { rows: [], total: 0 };
    const limit = opts.limit ?? PAGE_SIZE;
    const { data, error } = await db.rpc('search_content', {
      p_site: opts.site,
      p_terms: terms,
      p_types: opts.types ?? null,
      p_limit: limit,
      p_offset: ((opts.page ?? 1) - 1) * limit,
    });
    if (error) throw error;
    const rows = (data ?? []) as Array<SearchHit & { total: number }>;
    return { rows: rows.map(({ total: _t, ...r }) => r as SearchHit), total: Number(rows[0]?.total ?? 0) };
  });
}
