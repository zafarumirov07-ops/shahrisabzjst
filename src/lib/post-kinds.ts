import type { IconName } from '@/components/Icon';
import type { Dict } from '@/lib/i18n/dictionaries';
import type { PostKind } from '@/lib/types';

/** Har bir post turining ommaviy sayt yo'li (/news, /announcements, /library, /resources) */
export const POST_SECTION: Record<PostKind, string> = {
  news: 'news',
  announcement: 'announcements',
  library: 'library',
  resource: 'resources',
};

export const POST_ICON: Record<PostKind, IconName> = {
  news: 'newspaper',
  announcement: 'megaphone',
  library: 'book',
  resource: 'globe',
};

export function postKindLabel(kind: PostKind, dict: Dict): string {
  switch (kind) {
    case 'announcement':
      return dict.nav.announcements;
    case 'library':
      return dict.nav.library;
    case 'resource':
      return dict.nav.resources;
    default:
      return dict.nav.news;
  }
}

/** Admin paneldagi bo'lim (RESOURCES kaliti) */
export const POST_ADMIN_KEY: Record<PostKind, string> = {
  news: 'posts',
  announcement: 'posts',
  library: 'library',
  resource: 'digital',
};
