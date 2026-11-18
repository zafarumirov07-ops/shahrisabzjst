'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

export type CarouselItem = {
  url: string;
  caption?: string | null;
  /** Bosilganda ochiladigan sahifa (bo'lmasa onOpen chaqiriladi) */
  href?: string;
};

/**
 * Rasmlar karuseli: CSS scroll-snap (sensorli ekranda barmoq bilan suriladi), tugmalar, nuqtalar,
 * klaviatura (← →) va avtomatik aylanish. Kursor ustida, fokusda, sahifa yashirin bo'lganda yoki
 * "harakatni kamaytirish" yoqilgan bo'lsa avtomatik aylanish to'xtaydi.
 */
export default function Carousel({
  items,
  slideClass = 'basis-full',
  aspect = 'aspect-[16/10]',
  autoplayMs = 5000,
  onOpen,
  label,
  fit = 'cover',
  priorityFirst = false,
}: {
  items: CarouselItem[];
  slideClass?: string;
  aspect?: string;
  autoplayMs?: number;
  onOpen?: (index: number) => void;
  label: string;
  fit?: 'cover' | 'contain';
  priorityFirst?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const slideWidth = () => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  };

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const w = slideWidth();
    el.scrollTo({ left: i * w, behavior: 'smooth' });
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = track.current;
      if (!el) return;
      const w = slideWidth();
      if (!w) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
      else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      else el.scrollBy({ left: dir * w, behavior: 'smooth' });
    },
    [],
  );

  const onScroll = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const w = slideWidth();
      if (w) setIndex(Math.min(items.length - 1, Math.round((track.current?.scrollLeft ?? 0) / w)));
    });
  };

  // Avtomatik aylanish
  useEffect(() => {
    if (!autoplayMs || reduced || paused || items.length < 2) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') step(1);
    }, autoplayMs);
    return () => clearInterval(t);
  }, [autoplayMs, reduced, paused, items.length, step]);

  if (items.length === 0) return null;

  const dots = items.length <= 12;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="group/carousel relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          step(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          step(-1);
        }
      }}
    >
      <div
        ref={track}
        onScroll={onScroll}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth rounded-ios-lg pb-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => {
          const media = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.url}
              alt={it.caption ?? ''}
              loading={priorityFirst && i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition duration-700 group-hover/slide:scale-[1.03]`}
            />
          );
          const cls = `group/slide relative block ${aspect} w-full overflow-hidden rounded-ios-lg bg-surface2 shadow-ios`;
          return (
            <div
              key={it.url + i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${items.length}`}
              className={`${slideClass} shrink-0 snap-start`}
            >
              {it.href ? (
                <Link href={it.href} className={cls}>
                  {media}
                  {it.caption && <Caption text={it.caption} />}
                </Link>
              ) : onOpen ? (
                <button type="button" onClick={() => onOpen(i)} className={cls} aria-label={it.caption || `${i + 1}`}>
                  {media}
                  {it.caption && <Caption text={it.caption} />}
                </button>
              ) : (
                <div className={cls}>
                  {media}
                  {it.caption && <Caption text={it.caption} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => step(-1)}
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-ios backdrop-blur transition hover:bg-black/55 sm:left-3"
          >
            <Icon name="chevron-left" className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => step(1)}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-ios backdrop-blur transition hover:bg-black/55 sm:right-3"
          >
            <Icon name="chevron-right" className="h-6 w-6" strokeWidth={2.2} />
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden={!dots}>
            {dots ? (
              items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-2 bg-line hover:bg-muted'}`}
                />
              ))
            ) : (
              <span className="text-sm font-medium text-muted">
                {index + 1} / {items.length}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-left text-sm font-medium text-white">
      {text}
    </span>
  );
}
