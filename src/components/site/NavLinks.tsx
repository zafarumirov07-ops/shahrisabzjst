'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import type { NavGroup } from './Header';

export function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('http')) return false;
  const isHome = href.split('/').filter(Boolean).length <= 1;
  if (isHome) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemCls = (active: boolean) =>
  `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
    active ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
  }`;

/** Kompyuter versiyasidagi menyu: kam bo'lim, ochiladigan guruhlar (hover/klaviatura). */
export default function NavLinks({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() || '';

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 rounded-full bg-black/20 p-1 lg:flex">
      {groups.map((g) => {
        if (g.children) {
          const active = g.children.some((c) => isActive(pathname, c.href));
          return (
            <div key={g.label} className="group relative">
              <button type="button" className={itemCls(active)} aria-haspopup="menu">
                {g.label}
                <Icon name="chevron-down" className="h-3.5 w-3.5 transition group-hover:rotate-180 group-focus-within:rotate-180" strokeWidth={2.4} />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul
                  className="min-w-56 rounded-2xl p-2 shadow-ios-lg ring-1 ring-white/10"
                  style={{ background: 'var(--glass)', WebkitBackdropFilter: 'blur(18px)', backdropFilter: 'blur(18px)' }}
                >
                  {g.children.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                          isActive(pathname, c.href) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf/20 text-leaf">
                          <Icon name={c.icon} className="h-[18px] w-[18px]" />
                        </span>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }
        if (!g.href) return null;
        const active = isActive(pathname, g.href);
        return g.external ? (
          <a key={g.label} href={g.href} className={itemCls(false)}>
            {g.label}
            <Icon name="arrow-up-right" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </a>
        ) : (
          <Link key={g.label} href={g.href} className={itemCls(active)} aria-current={active ? 'page' : undefined}>
            {g.label}
          </Link>
        );
      })}
    </nav>
  );
}
