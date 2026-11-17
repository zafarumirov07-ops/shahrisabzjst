'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { saveRecord } from '@/app/admin/actions';
import Icon from '@/components/Icon';
import type { Field, Option, Resource } from '@/lib/admin/resources';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/config';
import { slugify } from '@/lib/utils';
import AttachmentsEditor, { type AttachmentItem } from './AttachmentsEditor';
import { FieldInput, LangTabs } from './Fields';

type Values = Record<string, unknown>;

export default function ResourceForm({
  resource,
  id,
  initial,
  initialAttachments,
  siteOptions,
  dynamicOptions,
}: {
  resource: Resource;
  id: string | null;
  initial: Values;
  initialAttachments: AttachmentItem[];
  siteOptions: Option[];
  /** field.name -> variantlar (optionsFrom orqali yuklangan) */
  dynamicOptions: Record<string, Option[]>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => {
    const merged: Values = { ...resource.defaults, ...initial };
    if (resource.hasSite && !merged.site) merged.site = siteOptions[0]?.value ?? 'main';
    return merged;
  });
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const [lang, setLang] = useState<Locale>(DEFAULT_LOCALE);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const hasI18n = resource.fields.some((f) => f.type.startsWith('i18n'));
  const listHref = `/admin/r/${resource.key}`;

  // Qaysi tillarda matn to'ldirilgani (tab yonidagi nuqta uchun)
  const filled = useMemo(() => {
    const out = { uz: false, ru: false, en: false } as Record<Locale, boolean>;
    for (const f of resource.fields) {
      if (!f.type.startsWith('i18n')) continue;
      const v = values[f.name] as Partial<Record<Locale, string>> | undefined;
      for (const l of LOCALES) if (v?.[l]?.trim()) out[l] = true;
    }
    return out;
  }, [values, resource.fields]);

  function setField(field: Field, value: unknown) {
    setSaved(false);
    setValues((cur) => {
      const next = { ...cur, [field.name]: value };
      // Slug sarlavhadan avtomatik hosil bo'ladi (qo'lda tahrirlanmaguncha)
      const slugField = resource.fields.find((f) => f.type === 'slug');
      if (slugField && field.name === slugField.from && !slugTouched) {
        const src = (value as Partial<Record<Locale, string>> | undefined)?.uz ?? '';
        next[slugField.name] = slugify(src);
      }
      if (field.type === 'slug') setSlugTouched(true);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveRecord(
        resource.key,
        id,
        values,
        attachments.map((a) => ({ id: a.id, kind: a.kind, url: a.url, text: a.text })),
      );
      if (result.error) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setSaved(true);
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {hasI18n && (
        <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-xl bg-page/90 px-1 py-2 backdrop-blur">
          <span className="text-sm font-medium text-muted">Matn tili:</span>
          <LangTabs lang={lang} onChange={setLang} filled={filled} />
          <span className="text-xs text-muted">O‘zbekcha majburiy, qolgan tillar ixtiyoriy (bo‘sh bo‘lsa o‘zbekcha ko‘rsatiladi)</span>
        </div>
      )}

      <div className="card space-y-5 p-5 sm:p-6">
        {resource.fields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            value={values[f.name]}
            onChange={(v) => setField(f, v)}
            lang={lang}
            siteOptions={siteOptions}
            options={dynamicOptions[f.name]}
          />
        ))}
      </div>

      {resource.attachments && (
        <div className="card space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-bold">{resource.attachments.label}</h2>
          <AttachmentsEditor config={resource.attachments} items={attachments} onChange={(a) => { setSaved(false); setAttachments(a); }} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        <Link href={listHref} className="btn-outline">
          Bekor qilish
        </Link>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
            Saqlandi
          </span>
        )}
      </div>
    </form>
  );
}
