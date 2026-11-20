'use client';

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type ReactNode } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { htmlToMd, mdToHtml, normalizeLink, pastedHtmlToMd } from '@/lib/admin/rich-text';
import MediaPicker from './MediaPicker';

/**
 * Vizual matn muharriri: foydalanuvchi **, #, - kabi belgilarni ko'rmaydi va yozmaydi.
 * Qalin/qiya tugmalar (yoki Ctrl+B / Ctrl+I) bilan belgilanadi. Saqlanadigan qiymat Markdown,
 * yozilgan maxsus belgilar (` - " * # > ...) esa matn sifatida himoyalanadi.
 */
export default function RichEditor({
  value,
  onChange,
  onPreview,
  preview,
  previewContent,
}: {
  value: string;
  onChange: (v: string) => void;
  onPreview: () => void;
  preview: boolean;
  previewContent: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const [picker, setPicker] = useState(false);
  const [active, setActive] = useState({ bold: false, italic: false });

  // Tashqaridan kelgan qiymat (til almashtirish, avto-tarjima) muharrirga yoziladi
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    if (lastRef.current !== value) {
      el.innerHTML = mdToHtml(value);
      lastRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'div');
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* eski brauzer */
    }
  }, []);

  const emit = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    const md = htmlToMd(el);
    lastRef.current = md;
    onChange(md);
  }, [onChange]);

  // Tanlov o'zgarganda B / I tugmalari holati
  useEffect(() => {
    function onSel() {
      const el = boxRef.current;
      const sel = window.getSelection();
      if (!el || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return;
      rangeRef.current = sel.getRangeAt(0).cloneRange();
      try {
        setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') });
      } catch {
        /* ignore */
      }
    }
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  function exec(cmd: string, arg?: string) {
    boxRef.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function restoreRange() {
    const el = boxRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (rangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(rangeRef.current);
    }
  }

  function heading() {
    boxRef.current?.focus();
    const cur = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
    document.execCommand('formatBlock', false, cur === 'h2' || cur === 'h3' ? 'div' : 'h2');
    emit();
  }

  function link() {
    const sel = window.getSelection();
    const hasSel = !!sel && !sel.isCollapsed;
    const raw = window.prompt(hasSel ? 'Havola manzili (https://…)' : 'Avval matnni belgilang, so‘ng havola qo‘ying', 'https://');
    if (!hasSel) return;
    const url = raw ? normalizeLink(raw) : null;
    restoreRange();
    if (url) exec('createLink', url);
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (html) {
      // Qalin/qiya/sarlavha/ro'yxat saqlanadi, rang, shrift va boshqa keraksiz uslublar tashlanadi
      const md = pastedHtmlToMd(html);
      if (md.trim()) {
        document.execCommand('insertHTML', false, mdToHtml(md));
        emit();
        return;
      }
    }
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    lines.forEach((l, i) => {
      if (i > 0) document.execCommand('insertParagraph');
      if (l) document.execCommand('insertText', false, l);
    });
    emit();
  }

  const btn = (on: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg transition ${
      on ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:bg-surface hover:text-fg'
    }`;

  const tools: Array<{ icon: IconName; title: string; on?: boolean; run: () => void }> = [
    { icon: 'heading', title: 'Sarlavha', run: heading },
    { icon: 'bold', title: 'Qalin (Ctrl+B)', on: active.bold, run: () => exec('bold') },
    { icon: 'italic', title: 'Qiya (Ctrl+I)', on: active.italic, run: () => exec('italic') },
    { icon: 'list', title: 'Ro‘yxat', run: () => exec('insertUnorderedList') },
    { icon: 'link', title: 'Havola (avval matnni belgilang)', run: link },
    {
      icon: 'image',
      title: 'Kutubxonadan rasm qo‘shish',
      run: () => {
        setPicker(true);
      },
    },
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
            aria-pressed={t.on}
            // tugma bosilganda muharrirdagi belgilangan matn yo'qolmasligi uchun
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className={btn(!!t.on)}
          >
            <Icon name={t.icon} className="h-[18px] w-[18px]" />
          </button>
        ))}
        <button
          type="button"
          onClick={onPreview}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            preview ? 'bg-accent text-[var(--accent-fg)]' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon name={preview ? 'edit' : 'eye'} className="h-4 w-4" />
          {preview ? 'Tahrirlash' : 'Ko‘rish'}
        </button>
      </div>
      {preview && previewContent}
      <div
        ref={boxRef}
        className="rte min-h-[14rem] p-4 text-[15px] outline-none"
        style={{ display: preview ? 'none' : undefined }}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Matnni shu yerga yozing. Belgilar (tirnoq, tire, ...) aynan yozganingizdek chiqadi."
        onInput={emit}
        onPaste={onPaste}
        onBlur={emit}
      />
      {picker && (
        <MediaPicker
          kinds={['image']}
          multiple
          onClose={() => setPicker(false)}
          onSelect={(items) => {
            setPicker(false);
            restoreRange();
            const html = items
              .filter((i) => /^(https?:)?\/\/|^\//.test(i.url))
              .map((i) => `<div><img src="${i.url.replace(/"/g, '&quot;')}" alt="${i.name.replace(/[<>"&]/g, ' ')}"></div>`)
              .join('');
            if (html) {
              document.execCommand('insertHTML', false, html);
              emit();
            }
          }}
        />
      )}
    </div>
  );
}
