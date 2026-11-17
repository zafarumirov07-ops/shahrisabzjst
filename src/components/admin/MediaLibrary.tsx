'use client';

import { useRef, useState } from 'react';
import { deleteMedia } from '@/app/admin/actions';
import Icon from '@/components/Icon';
import { uploadFile, type MediaRow } from '@/lib/admin/upload';
import { fileSizeLabel } from '@/lib/utils';

export default function MediaLibrary({ initial }: { initial: MediaRow[] }) {
  const [items, setItems] = useState<MediaRow[]>(initial);
  const [filter, setFilter] = useState<'all' | MediaRow['kind']>('all');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const row = await uploadFile(file);
        setItems((cur) => [row, ...cur]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Yuklashda xatolik');
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function remove(item: MediaRow) {
    if (!window.confirm(`"${item.name}" o‘chirilsinmi? Bu fayl ishlatilgan joylarda rasm ko‘rinmay qoladi.`)) return;
    const res = await deleteMedia(item.id);
    if (res.error) return setError(res.error);
    setItems((cur) => cur.filter((i) => i.id !== item.id));
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      window.prompt('Havolani nusxalang:', url);
    }
  }

  const shown = filter === 'all' ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all', 'image', 'video', 'file'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className={filter === k ? 'btn !py-1.5' : 'btn-outline !py-1.5'}>
              {k === 'all' ? 'Barchasi' : k === 'image' ? 'Rasmlar' : k === 'video' ? 'Videolar' : 'Fayllar'}
            </button>
          ))}
        </div>
        <div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
          <button type="button" className="btn" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Icon name="upload" className="h-[18px] w-[18px]" />
            {uploading ? 'Yuklanmoqda…' : 'Fayl yuklash'}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">
        Bitta fayl 50 MB gacha. Katta videolarni YouTube ga joylab, post ichida &quot;Video havola&quot; sifatida qo‘shing. Rasmlar avtomatik siqiladi.
      </p>
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      {shown.length === 0 ? (
        <p className="card p-10 text-center text-muted">Fayllar yo‘q</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((item) => (
            <li key={item.id} className="card overflow-hidden">
              <div className="flex aspect-square items-center justify-center bg-page">
                {item.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="chip uppercase">{item.kind === 'video' ? 'video' : item.name.split('.').pop()}</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>
                <p className="text-xs text-muted">{fileSizeLabel(item.size_bytes)}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button type="button" className="link text-xs font-semibold" onClick={() => void copy(item.url)}>
                    {copied === item.url ? (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Nusxalandi
                      </span>
                    ) : (
                      'Havolani nusxalash'
                    )}
                  </button>
                  <button type="button" className="text-xs font-semibold text-red-600" onClick={() => void remove(item)}>
                    O‘chirish
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
