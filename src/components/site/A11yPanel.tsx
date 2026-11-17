'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

type A11yState = { fs: number; contrast: boolean; dark: boolean };
const DEFAULT: A11yState = { fs: 0, contrast: false, dark: false };
const KEY = 'a11y';

function apply(s: A11yState) {
  const el = document.documentElement;
  if (s.fs > 0) el.setAttribute('data-fs', String(s.fs));
  else el.removeAttribute('data-fs');
  if (s.contrast) el.setAttribute('data-contrast', 'high');
  else el.removeAttribute('data-contrast');
  if (s.dark) el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
}

/** iOS uslubidagi o'chirgich (toggle) */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[1.9rem] w-[3.1rem] shrink-0 rounded-full transition-colors"
      style={{ background: checked ? 'var(--green)' : 'rgba(120,120,128,0.32)' }}
    >
      <span
        className="absolute left-0.5 top-0.5 h-[1.65rem] w-[1.65rem] rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(1.2rem)' : 'none' }}
      />
    </button>
  );
}

export default function A11yPanel({
  labels,
}: {
  labels: {
    title: string;
    fontSize: string;
    smaller: string;
    larger: string;
    contrast: string;
    dark: string;
    reset: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setState({ ...DEFAULT, ...JSON.parse(saved) });
    } catch {
      /* localStorage mavjud emas */
    }
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function update(next: A11yState) {
    setState(next);
    apply(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* e'tiborsiz */
    }
  }

  return (
    // "relative" yo'q: oyna header'ning o'ng chetiga tekislanadi va kichik ekranda chetdan chiqib ketmaydi
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={labels.title}
        title={labels.title}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
      >
        <Icon name="accessibility" className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={labels.title}
          className="anim-pop absolute right-3 top-full z-50 mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-ios bg-surface p-4 text-fg shadow-ios-lg sm:right-5 lg:right-8 2xl:right-12"
          style={{ border: '1px solid var(--line)' }}
        >
          <p className="mb-3 text-[15px] font-semibold">{labels.title}</p>

          <div className="list mb-3 !shadow-none" style={{ background: 'var(--surface-2)' }}>
            <div className="list-row justify-between">
              <span className="flex items-center gap-2.5 text-sm">
                <Icon name="text-size" className="h-5 w-5 text-muted" />
                {labels.fontSize}
              </span>
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-semibold disabled:opacity-40"
                  onClick={() => update({ ...state, fs: Math.max(0, state.fs - 1) })}
                  disabled={state.fs === 0}
                  aria-label={labels.smaller}
                >
                  A−
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-base font-bold disabled:opacity-40"
                  onClick={() => update({ ...state, fs: Math.min(3, state.fs + 1) })}
                  disabled={state.fs === 3}
                  aria-label={labels.larger}
                >
                  A+
                </button>
              </span>
            </div>
            <div className="list-row justify-between">
              <span className="flex items-center gap-2.5 text-sm">
                <Icon name="contrast" className="h-5 w-5 text-muted" />
                {labels.contrast}
              </span>
              <Switch checked={state.contrast} onChange={(v) => update({ ...state, contrast: v })} label={labels.contrast} />
            </div>
            <div className="list-row justify-between">
              <span className="flex items-center gap-2.5 text-sm">
                <Icon name="moon" className="h-5 w-5 text-muted" />
                {labels.dark}
              </span>
              <Switch checked={state.dark} onChange={(v) => update({ ...state, dark: v })} label={labels.dark} />
            </div>
          </div>

          <button type="button" className="btn-outline w-full" onClick={() => update(DEFAULT)}>
            {labels.reset}
          </button>
        </div>
      )}
    </div>
  );
}
