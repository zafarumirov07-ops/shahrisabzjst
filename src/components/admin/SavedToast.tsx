'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** ?saved=1 bilan kelganda "Saqlandi" xabarini ko'rsatadi va manzildan belgini olib tashlaydi. */
export default function SavedToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('saved') !== '1') return;
    url.searchParams.delete('saved');
    window.history.replaceState(null, '', url.pathname + (url.search || ''));
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-ios-lg"
    >
      <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={2.6} />
      Saqlandi
    </div>
  );
}
