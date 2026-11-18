'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** ?saved=1 bilan kelganda "Saqlandi" xabarini ko'rsatadi va manzildan belgini olib tashlaydi. */
export default function SavedToast() {
  const [show, setShow] = useState<'ok' | 'quota' | 'error' | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const v = url.searchParams.get('saved');
    if (!v) return;
    url.searchParams.delete('saved');
    window.history.replaceState(null, '', url.pathname + (url.search || ''));
    setShow(v === 'quota' ? 'quota' : v === 'error' ? 'error' : 'ok');
    const t = setTimeout(() => setShow(null), v === '1' ? 3500 : 9000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-[100] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-ios-lg ${
        show === 'ok' ? 'bg-emerald-600' : 'bg-amber-600'
      }`}
    >
      <Icon name="check" className="h-[18px] w-[18px] shrink-0" strokeWidth={2.6} />
      {show === 'ok'
        ? 'Saqlandi'
        : show === 'quota'
          ? 'Saqlandi, lekin tarjima xizmatining kunlik limiti tugagan: bo‘sh tillar keyin to‘ldiriladi (o‘zbekcha ko‘rsatiladi)'
          : 'Saqlandi, lekin avto tarjima bajarilmadi (xizmat javob bermadi)'}
    </div>
  );
}
