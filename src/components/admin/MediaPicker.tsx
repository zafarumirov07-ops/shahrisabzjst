'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { listMedia } from '@/app/admin/actions';
import Icon from '@/components/Icon';
import { uploadFile, type MediaRow } from '@/lib/admin/upload';
import { fileSizeLabel } from '@/lib/utils';

type Kind = MediaRow['kind'];

const ACCEPT: Record<Kind, string> = {
  image: 'image/*',
  video: 'video/mp4,video/webm,video/quicktime',
  file: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
};

export function MediaTile({ item, selected, onClick }: { item: MediaRow; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex aspect-square flex-col overflow-hidden rounded-xl border bg-page text-left transition ${
        selected ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-accent'
      }`}
      title={item.name}
    >
      {item.kind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="chip uppercase">{item.kind === 'video' ? 'video' : item.name.split('.').pop()}</span>
          <span className="line-clamp-3 break-all text-xs text-muted">{item.name}</span>
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
        {item.name} {fileSizeLabel(item.size_bytes)}
      </span>
      {selected && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-[var(--accent-fg)]">
          <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
        </span>
      )}
    </button>
  );
}

/** Media kutubxonasidan tanlash yoki yangi fayl yuklash oynasi. */
function MediaPickerInner({
  kinds,
  multiple = false,
  onSelect,
  onClose,
}: {
  kinds: Kind[];
  multiple?: boolean;
  onSelect: (items: MediaRow[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [selected, setSelected] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Kind>(kinds[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listMedia(filter);
    if (res.error) setError(res.error);
    setItems(res.rows);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(item: MediaRow) {
    setSelected((cur) => {
      const exists = cur.some((c) => c.id === item.id);
      if (!multiple) return exists ? [] : [item];
      return exists ? cur.filter((c) => c.id !== item.id) : [...cur, item];
    });
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const uploaded: MediaRow[] = [];
    for (const file of Array.from(files)) {
      try {
        uploaded.push(await uploadFile(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yuklashda xatolik');
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (uploaded.length === 0) return;
    // Yuklangan fayllar darrov tanlanadi
    setSelected((cur) => (multiple ? [...cur, ...uploaded] : [uploaded[0]]));
    await load();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="text-lg font-bold">Media kutubxonasi</h2>
          <div className="flex items-center gap-2">
            {kinds.length > 1 &&
              kinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={filter === k ? 'btn !py-1.5' : 'btn-outline !py-1.5'}
                >
                  {k === 'image' ? 'Rasmlar' : k === 'video' ? 'Videolar' : 'Fayllar'}
                </button>
              ))}
            <button type="button" onClick={onClose} className="btn-outline !px-3 !py-1.5" aria-label="Yopish">
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="py-10 text-center text-muted">Yuklanmoqda…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-muted">Bu turdagi fayllar hali yo&apos;q. Pastdagi tugma orqali yuklang.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((it) => (
                <MediaTile
                  key={it.id}
                  item={it}
                  selected={selected.some((s) => s.id === it.id)}
                  onClick={() => toggle(it)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
          <div>
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept={ACCEPT[filter]}
              className="hidden"
              onChange={(e) => void onFiles(e.target.files)}
            />
            <button type="button" className="btn-outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <Icon name="upload" className="h-[18px] w-[18px]" />
              {uploading ? 'Yuklanmoqda…' : 'Yangi fayl yuklash'}
            </button>
          </div>
          <button
            type="button"
            className="btn"
            disabled={selected.length === 0}
            onClick={() => onSelect(selected)}
          >
            Tanlash {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Oyna document.body ga chiqariladi (ota elementlardagi transform/filter uni qamab qo'ymasligi uchun) */
export default function MediaPicker(props: Parameters<typeof MediaPickerInner>[0]) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(<MediaPickerInner {...props} />, document.body) : null;
}
