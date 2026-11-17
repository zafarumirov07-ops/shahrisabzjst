import type { Metadata } from 'next';
import { PostListPage } from '@/components/site/PostViews';
import { getCtx, type SiteParams } from '@/lib/ctx';

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { dict } = await getCtx(params);
  return { title: dict.nav.news };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: SiteParams;
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await getCtx(params);
  const { page } = await searchParams;
  return <PostListPage ctx={ctx} kind="news" page={Math.max(1, Number(page) || 1)} />;
}
