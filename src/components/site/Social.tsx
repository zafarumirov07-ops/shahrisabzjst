import type { ReactNode } from 'react';

/**
 * Ijtimoiy tarmoq logotiplari (brend ranglarida, yumaloq tugma ichida oq belgi).
 * Havola kiritilmagan tarmoq ko'rsatilmaydi.
 */
type Brand = { label: string; bg: string; glyph: ReactNode };

const BRANDS: Record<string, Brand> = {
  telegram: {
    label: 'Telegram',
    bg: '#229ED9',
    glyph: (
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    ),
  },
  instagram: {
    label: 'Instagram',
    bg: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    glyph: (
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
    ),
  },
  facebook: {
    label: 'Facebook',
    bg: '#1877F2',
    glyph: <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.6V21h2.9z" />,
  },
  youtube: {
    label: 'YouTube',
    bg: '#FF0000',
    glyph: (
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    ),
  },
};

export function socialLabel(key: string): string {
  return BRANDS[key]?.label ?? key;
}

export function SocialGlyph({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const brand = BRANDS[name];
  if (!brand) return null;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      {brand.glyph}
    </svg>
  );
}

export function SocialBadge({ name, className = 'h-11 w-11', glyphClass = 'h-5 w-5' }: { name: string; className?: string; glyphClass?: string }) {
  const brand = BRANDS[name];
  if (!brand) return null;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full text-white ${className}`} style={{ background: brand.bg }}>
      <SocialGlyph name={name} className={glyphClass} />
    </span>
  );
}

/** Havolasi bor ijtimoiy tarmoqlar (faqat ma'lum tarmoqlar) */
export function knownSocials(socials: Record<string, string | undefined> | undefined): Array<[string, string]> {
  return Object.entries(socials ?? {}).filter(([k, v]) => !!v && k in BRANDS) as Array<[string, string]>;
}
