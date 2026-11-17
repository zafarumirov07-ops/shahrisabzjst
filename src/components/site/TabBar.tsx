'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import type { NavItem } from './Header';
import { isActive } from './NavLinks';

/** Telefonlar uchun iOS uslubidagi pastki tab bar va "Boshqa" oynasi (bottom sheet) */
export default function TabBar({ items, moreLabel }: { items: NavItem[]; moreLabel: string }) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const tabs = items.filter((i) => i.tab);

  // Sahifa almashganda oyna yopiladi
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const moreActive = items.some((i) => !i.tab && isActive(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Tabs"
        className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1 pt-1.5">
          {tabs.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10.5px] font-medium ${
                    active ? 'text-accent' : 'text-muted'
                  }`}
                >
                  <Icon name={item.icon} className="h-[26px] w-[26px]" strokeWidth={active ? 2 : 1.6} />
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className={`flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-[10.5px] font-medium ${
                moreActive ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon name="more" className="h-[26px] w-[26px]" />
              <span>{moreLabel}</span>
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={moreLabel}>
          <button
            type="button"
            aria-label="Close"
            className="anim-fade absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="anim-sheet safe-bottom absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[1.75rem] bg-page pb-4">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-page px-5 pb-2 pt-3">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-xl font-bold tracking-tight">{moreLabel}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-muted"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <ul className="list mx-4">
              {items.map((item) => {
                const body = (
                  <>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[var(--accent-fg)]">
                      <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <Icon
                      name={item.external ? 'arrow-up-right' : 'chevron-right'}
                      className="h-4 w-4 text-muted"
                    />
                  </>
                );
                return (
                  <li key={item.href}>
                    {item.external ? (
                      <a href={item.href} className="list-row">
                        {body}
                      </a>
                    ) : (
                      <Link href={item.href} className="list-row">
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
