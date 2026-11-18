'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { isLocale } from '@/lib/i18n/config';
import { QUALITY_SLUG } from '@/lib/site';
import type { NavGroup } from './Header';

export function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('http')) return false;
  const parts = href.split('/').filter(Boolean);
  // Bosh sahifa: "/", "/oz", "/talimsifati", "/talimsifati/oz"
  const isHome =
    parts.length === 0 ||
    (parts.length === 1 && (parts[0] === QUALITY_SLUG || isLocale(parts[0]))) ||
    (parts[0] === QUALITY_SLUG && parts.length === 2 && isLocale(parts[1]));
  if (isHome) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const itemCls = (active: boolean) =>
  `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
    active ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
  }`;

/**
 * Kompyuter/planshet menyusi. Guruhlar sichqoncha bilan ham, bosish (sensorli ekran) bilan ham ochiladi.
 */
export default function NavLinks({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  // Sahifa almashganda, tashqariga bosilganda yoki Escape bosilganda yopiladi
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <nav ref={ref} aria-label="Main" className="hidden items-center gap-1 rounded-full bg-black/20 p-1 lg:flex">
      {groups.map((g) => {
        if (g.children) {
          const active = g.children.some((c) => isActive(pathname, c.href));
          const isOpen = open === g.label;
          return (
            <div
              key={g.label}
              className="relative"
              onMouseEnter={() => setOpen(g.label)}
              onMouseLeave={() => setOpen((cur) => (cur === g.label ? null : cur))}
            >
              <button
                type="button"
                className={itemCls(active || isOpen)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() => setOpen((cur) => (cur === g.label ? null : g.label))}
              >
                {g.label}
                <Icon name="chevron-down" className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.4} />
              </button>
              <div
                className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition duration-200 ${
                  isOpen ? 'visible opacity-100' : 'invisible opacity-0'
                }`}
              >
                <ul
                  role="menu"
                  className="min-w-56 rounded-2xl p-2 shadow-ios-lg ring-1 ring-white/10"
                  style={{ background: 'var(--glass)', WebkitBackdropFilter: 'blur(18px)', backdropFilter: 'blur(18px)' }}
                >
                  {g.children.map((c) => (
                    <li key={c.href} role="none">
                      <Link
                        role="menuitem"
                        href={c.href}
                        onClick={() => setOpen(null)}
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
