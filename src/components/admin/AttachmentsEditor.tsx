'use client';

import { useState } from 'react';
import type { AttachmentKind, AttachmentsConfig } from '@/lib/admin/resources';
import Icon, { type IconName } from '@/components/Icon';
import MediaPicker from './MediaPicker';

export type AttachmentItem = {
  id?: string;
  kind: AttachmentKind;
  url: string;
  text: string;
};

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: 'Rasm',
  video: 'Video',
  file: 'Fayl',
  embed: 'Video havola',
};

const ADD_LABEL: Partial<Record<AttachmentKind, { label: string; icon: IconName }>> = {
  image: { label: 'Rasmlar', icon: 'image' },
  video: { label: 'Video fayl', icon: 'video' },
  file: { label: 'Fayl (PDF, Word...)', icon: 'file' },
};

export default function AttachmentsEditor({
  config,
  items,
  onChange,
}: {
  config: AttachmentsConfig;
  items: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
}) {
  const [pickerKind, setPickerKind] = useState<'image' | 'video' | 'file' | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addEmbed() {
    const url = embedUrl.trim();
    if (!/^https?:\/\//i.test(url)) return;
    onChange([...items, { kind: 'embed', url, text: '' }]);
    setEmbedUrl('');
  }

  const mediaKinds = config.kinds.filter((k): k is 'image' | 'video' | 'file' => k !== 'embed');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mediaKinds.map((k) => (
          <button key={k} type="button" className="btn-outline" onClick={() => setPickerKind(k)}>
            <Icon name={ADD_LABEL[k]?.icon ?? 'plus'} className="h-[18px] w-[18px]" />
            {ADD_LABEL[k]?.label}
          </button>
        ))}
      </div>

      {config.kinds.includes('embed') && (
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="YouTube yoki Vimeo havolasi (https://youtu.be/...)"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmbed();
              }
            }}
          />
          <button type="button" className="btn-outline shrink-0" onClick={addEmbed}>
            Qo‘shish
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Hali hech narsa biriktirilmagan
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={`${item.id ?? 'new'}-${item.url}-${i}`} className="card flex items-center gap-3 p-2">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-page text-xs text-muted">
                {item.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="chip">{KIND_LABEL[item.kind]}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  className="input !py-1.5"
                  placeholder={config.textField === 'caption' ? 'Izoh (ixtiyoriy)' : 'Sarlavha (ixtiyoriy)'}
                  value={item.text}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, text: e.target.value };
                    onChange(next);
                  }}
                />
                <p className="mt-1 truncate text-xs text-muted">{item.url}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <button type="button" className="btn-outline !px-2 !py-1" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yuqoriga">
                  <Icon name="arrow-up" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-outline !px-2 !py-1"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Pastga"
                >
                  <Icon name="arrow-down" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-outline !px-2 !py-1 !text-red-600"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  aria-label="O‘chirish"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pickerKind && (
        <MediaPicker
          kinds={[pickerKind]}
          multiple
          onClose={() => setPickerKind(null)}
          onSelect={(picked) => {
            setPickerKind(null);
            onChange([
              ...items,
              ...picked.map((m) => ({ kind: m.kind as AttachmentKind, url: m.url, text: '' })),
            ]);
          }}
        />
      )}
    </div>
  );
}
