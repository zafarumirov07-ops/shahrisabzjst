'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/Icon';

export type AdminNavLink = { href: string; label: string; icon: IconName };

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Link ichida: bosilgandan keyin sahifa yuklanguncha ikonka o'rnida aylanuvchi ko'rsatkich chiqadi */
function NavIcon({ icon }: { icon: IconName }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-5 w-5 text-accent" /> : <Icon name={icon} className="h-5 w-5 text-accent" />;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav({ links }: { links: AdminNavLink[] }) {
  const pathname = usePathname() || '';
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-4" aria-label="Admin">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-[14.5px] font-medium transition hover:bg-[var(--accent-soft)] hover:text-accent ${
              active ? 'bg-[var(--accent-soft)] text-accent' : 'text-fg'
            }`}
          >
            <NavIcon icon={l.icon} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
