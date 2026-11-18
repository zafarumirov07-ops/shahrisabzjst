import type { SiteSettings } from '@/lib/types';

type Contact = NonNullable<SiteSettings['contact']>;

function coords(c: Contact): { lat: number; lng: number } | null {
  const lat = Number(String(c.lat ?? '').replace(',', '.'));
  const lng = Number(String(c.lng ?? '').replace(',', '.'));
  if (!c.lat || !c.lng || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** Xaritada ochish havolasi: admin kiritgan havola, bo'lmasa koordinata, bo'lmasa manzil bo'yicha qidiruv */
export function mapLink(c: Contact, address?: string): string | undefined {
  if (c.map_url) return c.map_url;
  const p = coords(c);
  if (p) return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return undefined;
}

/** Marshrut qurish havolasi (koordinata yoki manzil bo'lsa) */
export function routeLink(c: Contact, address?: string): string | undefined {
  const p = coords(c);
  if (p) return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return undefined;
}

/** <iframe src> uchun embed manzili */
export function mapEmbed(c: Contact, address?: string): string | undefined {
  const p = coords(c);
  if (p) return `https://www.google.com/maps?q=${p.lat},${p.lng}&z=17&hl=uz&output=embed`;
  if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&hl=uz&output=embed`;
  return undefined;
}
