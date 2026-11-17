'use client';

import { createElement, useEffect, useRef, type ReactNode } from 'react';

type Anim = 'up' | 'left' | 'right' | 'zoom';

/** Ekranga kirganda silliq paydo bo'ladigan blok (IntersectionObserver). JS o'chiq bo'lsa kontent oddiy ko'rinadi. */
export default function Reveal({
  children,
  anim = 'up',
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  anim?: Anim;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    as,
    { ref, 'data-anim': anim, className: `reveal ${className}`, style: { animationDelay: `${delay}ms` } },
    children,
  );
}
