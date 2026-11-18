'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import type { ListFilter, Option } from '@/lib/admin/resources';
import { Spinner } from './AdminNav';

/**
 * Ro'yxat ustidagi qidiruv va filtrlar. O'zgarishlar URL (?q=&kind=...) orqali serverga boradi,
 * kutish paytida aylanuvchi ko'rsatkich chiqadi.
 */
export default function ListToolbar({
  q,
  values,
  filters,
  siteOptions,
}: {
  q: string;
  values: Record<string, string>;
  filters: ListFilter[];
  siteOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  const go = (next: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  };

  // Matn kiritilganda 350 ms kutib qidiradi
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go({ ...values, q: text.trim() }), 350);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const all: ListFilter[] = [
    ...(siteOptions.length > 1 ? [{ field: 'site', label: 'Sayt', options: siteOptions }] : []),
    ...filters,
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[14rem] flex-1">
        <span className="sr-only">Qidirish</span>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Sarlavha yoki nom bo‘yicha qidirish…"
          className="w-full rounded-xl bg-surface2 py-2.5 pl-10 pr-3 text-[15px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </label>
      {all.map((f) => (
        <select
          key={f.field}
          aria-label={f.label}
          value={values[f.field] ?? ''}
          onChange={(e) => go({ ...values, q: text.trim(), [f.field]: e.target.value })}
          className="rounded-xl bg-surface2 px-3 py-2.5 text-[14.5px] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">{f.label}: hammasi</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {pending && <Spinner className="h-5 w-5 text-accent" />}
    </div>
  );
}
