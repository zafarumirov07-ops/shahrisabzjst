'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon, { type IconName } from '@/components/Icon';
import type { Locale } from '@/lib/i18n/config';
import type { NavGroup } from './Header';
import LocaleSwitcher from './LocaleSwitcher';
import { isActive } from './NavLinks';

/**
 * Telefon va planshet uchun menyu: pastdan chiqadigan oyna (bottom sheet).
 * Muhim: oyna document.body ga "portal" orqali chiqariladi. Header'dagi backdrop-filter
 * position:fixed elementlarni header ichiga qamab qo'yadi, shuning uchun oyna u yerda ishlamaydi.
 */
export default function MobileMenu({
  groups,
  title,
  cta,
  locale,
  languageLabel,
}: {
  groups: NavGroup[];
  title: string;
  cta: { href: string; label: string };
  locale: Locale;
  languageLabel: string;
}) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
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

  const row = (href: string, label: string, icon: IconName, external?: boolean) => {
    const active = !external && isActive(pathname, href);
    const body = (
      <>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active ? 'bg-accent text-[var(--accent-fg)]' : 'bg-[var(--accent-soft)] text-accent'
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className={`flex-1 text-[16px] ${active ? 'font-extrabold' : 'font-semibold'}`}>{label}</span>
        <Icon name={external ? 'arrow-up-right' : 'chevron-right'} className="h-4 w-4 shrink-0 text-muted" />
      </>
    );
    const cls = 'list-row min-h-[56px] active:bg-surface2';
    return external ? (
      <a href={href} className={cls}>
        {body}
      </a>
    ) : (
      <Link href={href} className={cls} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}>
        {body}
      </Link>
    );
  };

  const sheet = (
    <div className="fixed inset-0 z-[100] text-fg lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="anim-fade absolute inset-0 bg-black/55" onClick={() => setOpen(false)} />
      <div
        className="anim-sheet absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[2rem] bg-page shadow-ios-lg"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="shrink-0 px-5 pb-3 pt-3">
          <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[var(--line)]" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-muted"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-2">
          <div className="sm:hidden">
            <p className="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-wider text-muted">{languageLabel}</p>
            <LocaleSwitcher locale={locale} variant="light" />
          </div>
          <ul className="list">
            {groups
              .filter((g) => !g.children && g.href)
              .map((g) => (
                <li key={g.label}>{row(g.href!, g.label, g.icon, g.external)}</li>
              ))}
          </ul>
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
          <Link href={cta.href} onClick={() => setOpen(false)} className="btn w-full !py-3.5 !text-base">
            {cta.label}
            <Icon name="arrow-up-right" className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={title}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95"
      >
        <Icon name="list" className="h-5 w-5" strokeWidth={2} />
      </button>
      {open && mounted && createPortal(sheet, document.body)}
    </div>
  );
}
