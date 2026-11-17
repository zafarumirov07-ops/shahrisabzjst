'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';

export type GalleryImage = { url: string; caption?: string | null };

/** Rasmlar to'plami + to'liq ekran ko'rish (lightbox). Lightbox document.body ga chiqariladi. */
export default function MediaGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length]);

  if (images.length === 0) return null;

  const navBtn =
    'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25';

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface2 shadow-ios"
            aria-label={img.caption || `Image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? ''}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {index !== null && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="anim-fade fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIndex(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            onClick={() => setIndex(null)}
          >
            <Icon name="x" className="h-5 w-5" strokeWidth={2} />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                className={`${navBtn} left-3`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((index - 1 + images.length) % images.length);
                }}
              >
                <Icon name="chevron-left" className="h-6 w-6" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next"
                className={`${navBtn} right-3`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((index + 1) % images.length);
                }}
              >
                <Icon name="chevron-right" className="h-6 w-6" strokeWidth={2} />
              </button>
            </>
          )}
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index].url}
              alt={images[index].caption ?? ''}
              className="max-h-[80dvh] w-auto max-w-full rounded-2xl object-contain"
            />
            {images[index].caption && (
              <figcaption className="mt-3 text-center text-sm text-white/80">{images[index].caption}</figcaption>
            )}
          </figure>
        </div>,
        document.body,
      )}
    </>
  );
}
