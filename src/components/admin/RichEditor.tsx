'use client';

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type ReactNode } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { htmlToMd, mdToHtml, normalizeLink, pastedHtmlToMd, tidyMd } from '@/lib/admin/rich-text';
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
  lang = 'uz',
}: {
  value: string;
  onChange: (v: string) => void;
  onPreview: () => void;
  preview: boolean;
  previewContent: ReactNode;
  lang?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // "Tartiblash" dan oldingi matn: "Qaytarish" uchun
  const [undo, setUndo] = useState<string | null>(null);
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
      setUndo(null);
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

  /** Muharrir matnini butunlay almashtiradi (Tartiblash / Qaytarish) */
  function replaceAll(md: string) {
    const el = boxRef.current;
    if (!el) return;
    el.innerHTML = mdToHtml(md);
    lastRef.current = md;
    onChange(md);
  }

  function tidy() {
    const el = boxRef.current;
    if (!el) return;
    const before = htmlToMd(el);
    const after = tidyMd(before, lang);
    if (!before.trim() || after === before) return;
    setUndo(before);
    replaceAll(after);
  }

  function undoTidy() {
    if (undo === null) return;
    replaceAll(undo);
    setUndo(null);
  }

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
    `inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium transition sm:px-2.5 ${
      on ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:bg-surface hover:text-fg'
    }`;

  const tools: Array<{ icon: IconName; label: string; title: string; on?: boolean; run: () => void }> = [
    { icon: 'heading', label: 'Sarlavha', title: 'Bo‘lim sarlavhasi (qayta bossangiz oddiy matn bo‘ladi)', run: heading },
    { icon: 'bold', label: 'Qalin', title: 'Qalin (Ctrl+B)', on: active.bold, run: () => exec('bold') },
    { icon: 'italic', label: 'Qiya', title: 'Qiya (Ctrl+I)', on: active.italic, run: () => exec('italic') },
    { icon: 'list', label: 'Ro‘yxat', title: 'Nuqtali ro‘yxat', run: () => exec('insertUnorderedList') },
    { icon: 'olist', label: 'Raqamli', title: 'Raqamli ro‘yxat', run: () => exec('insertOrderedList') },
    { icon: 'link', label: 'Havola', title: 'Havola (avval matnni belgilang)', run: link },
    { icon: 'image', label: 'Rasm', title: 'Kutubxonadan rasm qo‘shish', run: () => setPicker(true) },
  ];

  const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault(); // belgilangan matn yo'qolmasligi uchun

  return (
    <div className="overflow-hidden rounded-xl" style={{ background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap items-center gap-0.5 p-2" style={{ borderBottom: '0.5px solid var(--line)' }}>
        {tools.map((t) => (
          <button
            key={t.icon}
            type="button"
            title={t.title}
            aria-label={t.title}
            aria-pressed={t.on}
            disabled={preview}
            onMouseDown={keepFocus}
            onClick={t.run}
            className={`${btn(!!t.on)} disabled:opacity-40`}
          >
            <Icon name={t.icon} className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline">{t.label}</span>
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px sm:block" style={{ background: 'var(--line)' }} />
        <button
          type="button"
          title="Joylangan matnni avtomatik tartibga keltiradi: sarlavhalar, ro‘yxatlar, bo‘sh joylar, apostrof va tirnoq"
          disabled={preview}
          onMouseDown={keepFocus}
          onClick={tidy}
          className={`${btn(false)} disabled:opacity-40`}
          style={{ color: 'var(--accent)' }}
        >
          <Icon name="wand" className="h-[18px] w-[18px]" />
          Tartiblash
        </button>
        {undo !== null && !preview && (
          <button type="button" onMouseDown={keepFocus} onClick={undoTidy} className={btn(false)} title="Tartiblashdan oldingi matnni qaytarish">
            <Icon name="undo" className="h-[18px] w-[18px]" />
            Qaytarish
          </button>
        )}
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
        data-placeholder="Matnni shu yerga yozing yoki joylang. Belgilar (tirnoq, tire, ...) aynan yozganingizdek chiqadi."
        onInput={() => {
          setUndo(null);
          emit();
        }}
        onPaste={onPaste}
        onBlur={emit}
      />
      {!preview && (
        <p className="px-4 pb-3 text-xs text-muted" style={{ borderTop: '0.5px solid var(--line)', paddingTop: '0.6rem' }}>
          Enter, yangi qator. Bo‘sh qator, yangi abzats. Bo‘lim nomini <b>Sarlavha</b> tugmasi bilan belgilang, bandlarni{' '}
          <b>Ro‘yxat</b> bilan yozing. Boshqa joydan ko‘chirgan matn tartibsiz bo‘lsa, <b>Tartiblash</b> ni bosing.
        </p>
      )}
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
