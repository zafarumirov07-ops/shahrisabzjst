import type { ReactNode, SVGProps } from 'react';

/**
 * Sayt bo'ylab ishlatiladigan yagona SVG ikonlar to'plami (SF Symbols uslubida: yupqa chiziq, yumaloq uchlar).
 * Emoji ishlatilmaydi: barcha belgilar shu yerdan olinadi.
 */
const P = (d: string) => <path d={d} />;

const ICONS = {
  home: P('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z'),
  newspaper: (
    <>
      {P('M4 5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v14.5')}
      {P('M17 8.5h2.5A1.5 1.5 0 0 1 21 10v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5')}
      {P('M8 8.5h5M8 12h5M8 15.5h3')}
    </>
  ),
  megaphone: (
    <>
      {P('M3.5 10.5v3a1 1 0 0 0 1 1h2.2l8.3 4.2V5.3L6.7 9.5H4.5a1 1 0 0 0-1 1Z')}
      {P('M18.5 9a4.2 4.2 0 0 1 0 6')}
      {P('M7.5 14.5 8.6 19h2.4l-1-4.5')}
    </>
  ),
  graduation: (
    <>
      {P('M2 9.5 12 4.5l10 5-10 5-10-5Z')}
      {P('M6 12v4.5c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8V12')}
      {P('M22 9.5v5.5')}
    </>
  ),
  users: (
    <>
      {P('M16 19.5V18a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18v1.5')}
      <circle cx="10" cy="8" r="3.5" />
      {P('M20 19.5V18a3.5 3.5 0 0 0-2.5-3.35')}
      {P('M15.5 4.7a3.5 3.5 0 0 1 0 6.6')}
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      {P('M4 20.5a8 8 0 0 1 16 0')}
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      {P('M21 16l-5-5-9.5 8.5')}
    </>
  ),
  video: (
    <>
      <rect x="3" y="5.5" width="13" height="13" rx="2.5" />
      {P('M16 10.5 21 7.5v9l-5-3')}
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      {P('M3.5 10h17M8 3v4M16 3v4')}
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      {P('M12 11v5M12 8h.01')}
    </>
  ),
  phone: P('M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z'),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      {P('M3.5 7.5 12 13l8.5-5.5')}
    </>
  ),
  pin: (
    <>
      {P('M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z')}
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      {P('M12 7v5l3 2')}
    </>
  ),
  'chevron-right': P('M9 5.5 15.5 12 9 18.5'),
  'chevron-left': P('M15 5.5 8.5 12 15 18.5'),
  'chevron-down': P('M5.5 9 12 15.5 18.5 9'),
  'chevron-up': P('M5.5 15 12 8.5 18.5 15'),
  'arrow-right': P('M4.5 12h15M13.5 6l6 6-6 6'),
  'arrow-left': P('M19.5 12h-15M10.5 6l-6 6 6 6'),
  'arrow-up': P('M12 19.5v-15M6 10.5l6-6 6 6'),
  'arrow-down': P('M12 4.5v15M6 13.5l6 6 6-6'),
  'arrow-up-right': P('M7 17 17 7M8.5 7H17v8.5'),
  download: P('M12 4v11M7 11l5 5 5-5M5 20h14'),
  upload: P('M12 16V5M7 9l5-5 5 5M5 20h14'),
  file: (
    <>
      {P('M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z')}
      {P('M14 3v5h5')}
    </>
  ),
  eye: (
    <>
      {P('M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z')}
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  accessibility: (
    <>
      <circle cx="12" cy="4.5" r="1.7" />
      {P('M4.5 8.5l7.5 1.5 7.5-1.5M12 10v4.5M9 21l3-6.5L15 21')}
    </>
  ),
  moon: P('M20 14.6A8 8 0 0 1 9.4 4 8 8 0 1 0 20 14.6Z'),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      {P('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4')}
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
    </>
  ),
  'text-size': P('M3.5 19 9 5.5 14.5 19M5.3 14.5h7.4M15.5 19l3-7.5 3 7.5M16.6 17h4'),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  plus: P('M12 5v14M5 12h14'),
  check: P('M5 12.5l4.5 4.5L19 7.5'),
  x: P('M6 6l12 12M18 6 6 18'),
  trash: P('M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v6M14 11v6'),
  edit: P('M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4'),
  bold: P('M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z'),
  italic: P('M10 5h8M6 19h8M14 5l-4 14'),
  heading: P('M6 5v14M18 5v14M6 12h12'),
  list: P('M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01'),
  link: P('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'),
  olist: P('M10 6h10M10 12h10M10 18h10M4 5l1.2-.7V9M3.6 14.6c0-1.1 1.7-1.1 1.7 0 0 1-1.7 1.4-1.7 2.6h1.9'),
  wand: P('M12 3l1.5 4.2L17.7 8.7 13.5 10.2 12 14.4 10.5 10.2 6.3 8.7l4.2-1.5L12 3ZM18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z'),
  undo: P('M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11'),
  cross: P('M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3Z'),
  book: (
    <>
      {P('M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z')}
      {P('M4 20a2 2 0 0 1 2-2h13v3H6a2 2 0 0 1-2-1Z')}
    </>
  ),
  shield: (
    <>
      {P('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z')}
      {P('M9 12l2 2 4-4')}
    </>
  ),
  chart: P('M5 20V11M12 20V4M19 20v-6'),
  folder: P('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'),
  logout: P('M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9'),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      {P('M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18')}
    </>
  ),
  history: P('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 8v4l3 2'),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
    </>
  ),
  paperclip: P('M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7-7'),
  building: (
    <>
      {P('M4 21V8.5l8-5 8 5V21')}
      {P('M9 21v-6h6v6M9 11h.01M15 11h.01')}
    </>
  ),
  star: P('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5Z'),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      {P('M16 16l4.5 4.5')}
    </>
  ),
  telegram: P('M21 4 3 11.2l6 2.3 2.3 6.2 3.3-4.3 5 3.6L21 4ZM9 13.5l9-6.5'),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r=".6" fill="currentColor" />
    </>
  ),
  facebook: P('M14 8.5h3V4.5h-3a4 4 0 0 0-4 4V11H7v4h3v6h4v-6h3l1-4h-4V8.8a.3.3 0 0 1 .3-.3Z'),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />,
  users3: (
    <>
      <circle cx="12" cy="8" r="3" />
      {P('M6.5 20v-1.2A3.8 3.8 0 0 1 10.3 15h3.4a3.8 3.8 0 0 1 3.8 3.8V20')}
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export default function Icon({
  name,
  className = 'h-5 w-5',
  strokeWidth = 1.7,
  ...rest
}: { name: IconName; className?: string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}
