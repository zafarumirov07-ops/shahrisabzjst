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
    if (postId) {
      void db.rpc('track_post_view', { p_post_id: postId });
    } else if (site) {
      void db.rpc('track_page_view', { p_site: site });
    }
  }, [postId, site]);

  return null;
}
