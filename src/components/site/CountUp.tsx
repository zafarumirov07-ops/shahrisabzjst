'use client';

import { useEffect, useRef, useState } from 'react';

function format(n: number): string {
  return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
}

/** Raqam ekranga kirganda 0 dan boshlab sanab chiqadi. */
export default function CountUp({ value, suffix = '', duration = 1700 }: { value: string; suffix?: string; duration?: number }) {
  const target = Number(String(value).replace(/\s/g, ''));
  const isNumber = Number.isFinite(target);
  const [n, setN] = useState(isNumber ? target : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isNumber) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(target * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        setN(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, isNumber, duration]);

  return (
    <span ref={ref}>
      {isNumber ? format(n) : value}
      {suffix}
    </span>
  );
}
