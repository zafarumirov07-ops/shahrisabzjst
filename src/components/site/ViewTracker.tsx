'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SUPABASE_CONFIGURED } from '@/lib/supabase/env';

/**
 * Statistika: post ko'rilishi (postId berilsa) yoki sayt tashrifi (site berilsa).
 * Bir brauzer sessiyasida bir xil narsa faqat bir marta hisoblanadi.
 */
export default function ViewTracker({ postId, site }: { postId?: string; site?: string }) {
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    const key = postId ? `viewed:${postId}` : `visited:${site}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* sessionStorage yo'q bo'lsa ham hisoblaymiz */
    }
    const db = createClient();
    // Diqqat: supabase-js rpc() "dangasa": so'rov faqat .then()/await bilan yuboriladi (`void` bilan hech qachon ketmaydi)
    const noop = () => {};
    if (postId) {
      db.rpc('track_post_view', { p_post_id: postId }).then(noop, noop);
    } else if (site) {
      db.rpc('track_page_view', { p_site: site }).then(noop, noop);
    }
  }, [postId, site]);

  return null;
}
