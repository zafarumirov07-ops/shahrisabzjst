'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Icon, { type IconName } from '@/components/Icon';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { SOCIAL_KEYS, type Field, type Option } from '@/lib/admin/resources';
import { toLocalInput } from '@/lib/admin/upload';
import MediaPicker from './MediaPicker';

// Ko'rish rejimi faqat kerak bo'lganda yuklanadi (forma tezroq ochiladi)
const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
  ssr: false,
  loading: () => <p className="text-muted">Yuklanmoqda…</p>,
});

export type I18nValue = Partial<Record<Locale, string>>;

/** Tillar tabi: to'ldirilgan tillar yonida nuqta ko'rsatiladi */
export function LangTabs({
  lang,
  onChange,
  filled,
}: {
  lang: Locale;
  onChange: (l: Locale) => void;
  filled: Record<Locale, boolean>;
}) {
  return (
    <div className="segmented" role="tablist" aria-label="Til">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={lang === l}
          onClick={() => onChange(l)}
          className="flex items-center gap-1.5 !px-3.5 !py-1.5 !text-sm"
        >
          {LOCALE_LABELS[l]}
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: filled[l] ? 'var(--green)' : 'currentColor', opacity: filled[l] ? 1 : 0.25 }}
          />
        </button>
      ))}
    </div>
  );
}

function MarkdownEditor({
  value,
  onChange,
  rows = 14,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(false);

  function edit(fn: (sel: string) => { text: string; select?: [number, number] }) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const { text } = fn(sel);
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const tools: Array<{ icon: IconName; title: string; run: () => void }> = [
    { icon: 'heading', title: 'Sarlavha', run: () => edit((s) => ({ text: `\n## ${s || 'Sarlavha'}\n` })) },
    { icon: 'bold', title: 'Qalin', run: () => edit((s) => ({ text: `**${s || 'matn'}**` })) },
    { icon: 'italic', title: 'Qiya', run: () => edit((s) => ({ text: `*${s || 'matn'}*` })) },
    { icon: 'list', title: 'Ro‘yxat', run: () => edit((s) => ({ text: `\n- ${s || 'band'}\n- ` })) },
    { icon: 'link', title: 'Havola', run: () => edit((s) => ({ text: `[${s || 'matn'}](https://)` })) },
    { icon: 'image', title: 'Kutubxonadan rasm qo‘shish', run: () => setPicker(true) },
  ];

  return (
    <div className="overflow-hidden rounded-xl" style={{ background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap items-center gap-1 p-2" style={{ borderBottom: '0.5px solid var(--line)' }}>
        {tools.map((t) => (
          <button
            key={t.icon}
            type="button"
            title={t.title}
            aria-label={t.title}
            onClick={t.run}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
          >
            <Icon name={t.icon} className="h-[18px] w-[18px]" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            preview ? 'bg-accent text-[var(--accent-fg)]' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon name={preview ? 'edit' : 'eye'} className="h-4 w-4" />
          {preview ? 'Tahrirlash' : 'Ko‘rish'}
        </button>
      </div>
      {preview ? (
        <div className="prose min-h-[10rem] max-w-none p-4">
          {value.trim() ? (
            <MarkdownPreview value={value} />
          ) : (
            <p className="text-muted">Matn bo‘sh</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full resize-y rounded-b-xl bg-transparent p-4 font-mono text-sm outline-none"
          placeholder="Matnni shu yerga yozing. Markdown: **qalin**, ## sarlavha, - ro‘yxat"
        />
      )}
      {picker && (
        <MediaPicker
          kinds={['image']}
          multiple
          onClose={() => setPicker(false)}
          onSelect={(items) => {
            setPicker(false);
            edit(() => ({ text: items.map((i) => `\n![${i.name}](${i.url})\n`).join('') }));
          }}
        />
      )}
    </div>
  );
}

export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-page text-xs text-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          'Rasm yo‘q'
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline" onClick={() => setOpen(true)}>
          {value ? 'Almashtirish' : 'Rasm tanlash / yuklash'}
        </button>
        {value && (
          <button type="button" className="btn-outline" onClick={() => onChange('')}>
            Olib tashlash
          </button>
        )}
      </div>
      {open && (
        <MediaPicker
          kinds={['image']}
          onClose={() => setOpen(false)}
          onSelect={(items) => {
            setOpen(false);
            if (items[0]) onChange(items[0].url);
          }}
        />
      )}
    </div>
  );
}

export type FieldInputProps = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  lang: Locale;
  siteOptions?: Option[];
  /** optionsFrom orqali yuklangan variantlar */
  options?: Option[];
};

export function FieldInput({ field, value, onChange, lang, siteOptions, options }: FieldInputProps) {
  const id = `f-${field.name}`;

  const label = (
    <label htmlFor={id} className="label">
      {field.label}
      {field.required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
  const help = field.help ? <p className="mt-1 text-xs text-muted">{field.help}</p> : null;

  switch (field.type) {
    case 'i18n':
    case 'i18n-textarea':
    case 'i18n-markdown': {
      const obj = (value && typeof value === 'object' ? value : {}) as I18nValue;
      const current = obj[lang] ?? '';
      const set = (v: string) => onChange({ ...obj, [lang]: v });
      return (
        <div>
          {label}
          {field.type === 'i18n' && (
            <input id={id} className="input" value={current} onChange={(e) => set(e.target.value)} lang={lang} />
          )}
          {field.type === 'i18n-textarea' && (
            <textarea id={id} className="input" rows={3} value={current} onChange={(e) => set(e.target.value)} lang={lang} />
          )}
          {field.type === 'i18n-markdown' && <MarkdownEditor value={current} onChange={set} />}
          {help}
        </div>
      );
    }

    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            id={id}
            className="input"
            rows={4}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            id={id}
            type="number"
            className="input"
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex cursor-pointer items-center gap-3 py-1">
          <input
            id={id}
            type="checkbox"
            className="h-5 w-5 accent-[var(--accent)]"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm font-medium">{field.label}</span>
        </label>
      );

    case 'select':
    case 'site': {
      const opts = field.type === 'site' ? siteOptions ?? [] : field.options ?? options ?? [];
      return (
        <div>
          {label}
          <select
            id={id}
            className="input"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          >
            {!field.required && <option value="">— tanlanmagan —</option>}
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    }

    case 'datetime':
      return (
        <div>
          {label}
          <input
            id={id}
            type="datetime-local"
            className="input"
            value={toLocalInput(value as string | null)}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
          {help}
        </div>
      );

    case 'image':
      return (
        <div>
          {label}
          <ImageField value={String(value ?? '')} onChange={onChange} />
          {help}
        </div>
      );

    case 'socials': {
      const obj = (value && typeof value === 'object' ? value : {}) as Record<string, string>;
      return (
        <div>
          {label}
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_KEYS.map((k) => (
              <input
                key={k}
                className="input"
                placeholder={`${k[0].toUpperCase()}${k.slice(1)} havolasi`}
                value={obj[k] ?? ''}
                onChange={(e) => onChange({ ...obj, [k]: e.target.value })}
              />
            ))}
          </div>
          {help}
        </div>
      );
    }

    case 'url':
    case 'slug':
    case 'text':
    default:
      return (
        <div>
          {label}
          <input
            id={id}
            type={field.type === 'url' ? 'url' : 'text'}
            className="input"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </div>
      );
  }
}
