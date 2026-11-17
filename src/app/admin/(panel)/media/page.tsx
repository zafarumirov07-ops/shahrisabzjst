import type { Metadata } from 'next';
import MediaLibrary from '@/components/admin/MediaLibrary';
import { requireStaff } from '@/lib/admin/auth';
import type { MediaRow } from '@/lib/admin/upload';

export const metadata: Metadata = { title: 'Media kutubxonasi' };

export default async function MediaPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false }).limit(200);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Media kutubxonasi</h1>
      <MediaLibrary initial={(data ?? []) as MediaRow[]} />
    </div>
  );
}
