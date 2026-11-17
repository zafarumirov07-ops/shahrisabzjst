'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import type { NavGroup } from './Header';

/** Telefon va planshet uchun menyu: pastdan chiqadigan oyna (bottom sheet) */
export default function MobileMenu({
  groups,
  title,
  cta,
}: {
  groups: NavGroup[];
  title: string;
  cta: { href: string; label: string };
}) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);

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

  const row = (href: string, label: string, icon: Parameters<typeof Icon>[0]['name'], external?: boolean) => {
    const body = (
      <>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="flex-1 font-semibold">{label}</span>
        <Icon name={external ? 'arrow-up-right' : 'chevron-right'} className="h-4 w-4 text-muted" />
      </>
    );
    return external ? (
      <a href={href} className="list-row">
        {body}
      </a>
    ) : (
      <Link href={href} className="list-row">
        {body}
      </Link>
    );
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={title}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95"
      >
        <Icon name="list" className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] text-fg" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label="Close" className="anim-fade absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="anim-sheet absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-page pb-6">
            <div className="sticky top-0 z-10 bg-page px-5 pb-3 pt-3">
              <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-muted"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-4">
              {groups.map((g) =>
                g.children ? (
                  <div key={g.label}>
                    <p className="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-wider text-muted">{g.label}</p>
                    <ul className="list">
                      {g.children.map((c) => (
                        <li key={c.href}>{row(c.href, c.label, c.icon, c.external)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              <ul className="list">
                {groups
                  .filter((g) => !g.children && g.href)
                  .map((g) => (
                    <li key={g.label}>{row(g.href!, g.label, g.icon, g.external)}</li>
                  ))}
              </ul>
              <Link href={cta.href} className="btn w-full !py-3">
                {cta.label}
                <Icon name="arrow-up-right" className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
