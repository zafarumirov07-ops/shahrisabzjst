'use client';

import { useState, useTransition } from 'react';
import { saveSetting } from '@/app/admin/actions';
import Icon from '@/components/Icon';
import type { Field } from '@/lib/admin/resources';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/config';
import { FieldInput, LangTabs } from './Fields';

export type SettingsSection = {
  key: 'contact' | 'socials' | 'hero' | 'stats';
  title: string;
  description?: string;
  fields: Field[];
  initial: Record<string, unknown>;
};

function Section({ site, section, lang }: { site: string; section: SettingsSection; lang: Locale }) {
  const [values, setValues] = useState<Record<string, unknown>>(section.initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card space-y-5 p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const res = await saveSetting(site, section.key, values);
          setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Saqlandi' });
        });
      }}
    >
      <div>
        <h2 className="text-lg font-bold">{section.title}</h2>
        {section.description && <p className="text-sm text-muted">{section.description}</p>}
      </div>
      {section.fields.map((f) => (
        <FieldInput
          key={f.name}
          field={f}
          value={values[f.name]}
          lang={lang}
          onChange={(v) => {
            setMsg(null);
            setValues((cur) => ({ ...cur, [f.name]: v }));
          }}
        />
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
        {msg && (
          <span className={`inline-flex items-center gap-1 text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.ok && <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />}
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

export default function SettingsForm({ site, sections }: { site: string; sections: SettingsSection[] }) {
  const [lang, setLang] = useState<Locale>(DEFAULT_LOCALE);
  const filled = Object.fromEntries(LOCALES.map((l) => [l, l === DEFAULT_LOCALE])) as Record<Locale, boolean>;
  for (const l of LOCALES) {
    for (const s of sections)
      for (const f of s.fields) {
        const v = s.initial[f.name] as Record<string, string> | undefined;
        if (f.type.startsWith('i18n') && v?.[l]) filled[l] = true;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted">Matn tili:</span>
        <LangTabs lang={lang} onChange={setLang} filled={filled} />
      </div>
      {sections.map((s) => (
        <Section key={`${site}-${s.key}`} site={site} section={s} lang={lang} />
      ))}
    </div>
  );
}
