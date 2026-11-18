import type { I18n } from '@/lib/i18n/config';
import type { Site } from '@/lib/site';

export type Post = {
  id: string;
  site: Site;
  kind: 'news' | 'announcement';
  slug: string;
  status: 'draft' | 'published';
  published_at: string | null;
  title: I18n;
  excerpt: I18n;
  body: I18n;
  cover_url: string | null;
  category_id: string | null;
  pinned: boolean;
  view_count: number;
};

export type PostMedia = {
  id: string;
  post_id: string;
  kind: 'image' | 'video' | 'file' | 'embed';
  url: string;
  title: string | null;
  sort_order: number;
};

export type Page = {
  id: string;
  site: Site;
  slug: string;
  title: I18n;
  body: I18n;
  published: boolean;
};

export type Staff = {
  id: string;
  site: Site;
  group_key: 'leadership' | 'teacher' | 'staff' | 'responsible';
  department_id: string | null;
  full_name: string;
  position: I18n;
  bio: I18n;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  socials: Record<string, string>;
  sort_order: number;
};

export type Department = {
  id: string;
  slug: string;
  name: I18n;
  description: I18n;
  sort_order: number;
};

export type Program = {
  id: string;
  slug: string;
  name: I18n;
  description: I18n;
  duration: I18n;
  study_form: I18n;
  language: I18n;
  quota: number | null;
  sort_order: number;
  body?: I18n;
  cover_url?: string | null;
};

export type EventRow = {
  id: string;
  slug?: string | null;
  site: Site;
  title: I18n;
  description: I18n;
  location: I18n;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
};

export type Album = {
  id: string;
  site: Site;
  slug: string;
  title: I18n;
  description: I18n;
  cover_url: string | null;
  published_at: string;
};

export type AlbumItem = {
  id: string;
  album_id: string;
  kind: 'image' | 'video' | 'embed';
  url: string;
  caption: string | null;
  sort_order: number;
};

export type SiteSettings = {
  contact?: {
    phone?: string;
    email?: string;
    address?: I18n;
    working_hours?: I18n;
    map_url?: string;
    lat?: string;
    lng?: string;
  };
  socials?: {
    telegram?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  stats?: {
    students?: string;
    teachers?: string;
    founded?: string;
  };
  hero?: {
    title?: I18n;
    subtitle?: I18n;
    image_url?: string;
  };
};

export type SearchType = 'news' | 'announcement' | 'event' | 'album' | 'program' | 'page';

export type SearchHit = {
  type: SearchType;
  id: string;
  slug: string;
  title: I18n;
  snippet: I18n;
  cover_url: string | null;
  at: string | null;
};

export type RecentPhoto = { url: string; caption: I18n; albumSlug: string };
