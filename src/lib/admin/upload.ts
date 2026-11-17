'use client';

import { createUploadTarget, registerMedia } from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/client';

export type MediaRow = {
  id: string;
  path: string;
  url: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: 'image' | 'video' | 'file';
  created_at: string;
};

/** Supabase Storage bepul rejasidagi bitta fayl chegarasi */
export const MAX_BYTES = 50 * 1024 * 1024;

export function mediaKindOf(mime: string): MediaRow['kind'] {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
}

/** Katta rasmlarni brauzerda siqadi (maks. 1920px, WebP). GIF va kichik rasmlarga tegilmaydi. */
async function compressImage(file: File): Promise<File> {
  const compressible = ['image/jpeg', 'image/png', 'image/webp'];
  if (!compressible.includes(file.type) || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    if (!blob || blob.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}

/**
 * Yuklash tartibi: server imzolangan manzil beradi, fayl brauzerdan to'g'ridan-to'g'ri Supabase Storage'ga ketadi
 * (Vercel hajm chegarasiga tushmaydi), so'ng server kutubxonaga yozadi.
 */
export async function uploadFile(original: File): Promise<MediaRow> {
  const file = await compressImage(original);
  if (file.size > MAX_BYTES) {
    throw new Error(
      `"${original.name}" 50 MB dan katta. Katta videoni YouTube ga joylab, havolasini "Video havola" sifatida qo'shing.`,
    );
  }

  const target = await createUploadTarget(file.name, file.type, file.size);
  if (target.error || !target.path || !target.token) throw new Error(target.error ?? 'Yuklash manzili olinmadi');

  const { error: upErr } = await createClient()
    .storage.from('media')
    .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type || undefined });
  if (upErr) throw new Error(`Yuklashda xatolik: ${upErr.message}`);

  const reg = await registerMedia({
    path: target.path,
    name: original.name,
    mime_type: file.type,
    size_bytes: file.size,
    kind: mediaKindOf(file.type || ''),
  });
  if (reg.error || !reg.row) throw new Error(reg.error ?? 'Kutubxonaga yozib bo‘lmadi');
  return reg.row;
}

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
