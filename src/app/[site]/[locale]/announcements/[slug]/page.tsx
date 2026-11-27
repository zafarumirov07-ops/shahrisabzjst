import type { Metadata } from 'next';
import { PostDetailPage, postMetadata } from '@/components/site/PostViews';
import { getCtx } from '@/lib/ctx';

type Params = Promise<{ site: string; locale: string; slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const ctx = await getCtx(Promise.resolve(p));
  return postMetadata(ctx, decodeURIComponent(p.slug));
}

export default async function AnnouncementDetail({ params }: { params: Params }) {
  const p = await params;
  const ctx = await getCtx(Promise.resolve(p));
  return <PostDetailPage ctx={ctx} slug={decodeURIComponent(p.slug)} kinds={['news', 'announcement']} />;
}
