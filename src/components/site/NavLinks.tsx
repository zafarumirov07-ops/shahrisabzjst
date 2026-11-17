'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import type { NavItem } from './Header';

export function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('http')) return false;
  const isHome = href.split('/').filter(Boolean).length <= 1;
  if (isHome) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Kompyuter versiyasidagi yuqori menyu (faqat lg dan katta ekranlarda) */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || '';
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const cls = `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
          active ? 'bg-[var(--accent-soft)] text-accent' : 'text-muted hover:text-fg'
        }`;
        return item.external ? (
          <a key={item.href} href={item.href} className={cls}>
            {item.label}
            <Icon name="arrow-up-right" className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link key={item.href} href={item.href} className={cls} aria-current={active ? 'page' : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
