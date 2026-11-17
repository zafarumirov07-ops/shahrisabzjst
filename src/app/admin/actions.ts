'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  allowedSites,
  getSessionProfile,
  requireStaff,
  requireSuperAdmin,
  type AppRole,
} from '@/lib/admin/auth';
import { RESOURCES, SOCIAL_KEYS, type Field } from '@/lib/admin/resources';
import { LOCALES } from '@/lib/i18n/config';
import { slugify } from '@/lib/utils';

export type ActionResult = { ok?: boolean; error?: string; id?: string };

export type AttachmentInput = {
  id?: string;
  kind: 'image' | 'video' | 'file' | 'embed';
  url: string;
  text?: string | null;
};

type Values = Record<string, unknown>;

/** Sayt kontenti o'zgargach ommaviy sahifalar keshini darrov yangilaydi. */
function refreshPublic() {
  revalidatePath('/[site]/[locale]', 'layout');
}

function normalizeI18n(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (value && typeof value === 'object') {
    for (const l of LOCALES) {
      const v = (value as Record<string, unknown>)[l];
      if (typeof v === 'string' && v.trim()) out[l] = v.trim();
    }
  }
  return out;
}

function normalizeValue(value: unknown, field: Field): unknown {
  switch (field.type) {
    case 'checkbox':
      return Boolean(value);
    case 'number': {
      if (value === '' || value === null || value === undefined) return field.name === 'sort_order' ? 0 : null;
      const n = Number(value);
      return Number.isFinite(n) ? n : field.name === 'sort_order' ? 0 : null;
    }
    case 'i18n':
    case 'i18n-textarea':
    case 'i18n-markdown':
      return normalizeI18n(value);
    case 'socials': {
      const out: Record<string, string> = {};
      if (value && typeof value === 'object') {
        for (const k of SOCIAL_KEYS) {
          const v = (value as Record<string, unknown>)[k];
          if (typeof v === 'string' && v.trim()) out[k] = v.trim();
        }
      }
      return out;
    }
    case 'datetime': {
      if (!value) return null;
      const d = new Date(String(value));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    default: {
      if (value === null || value === undefined) return null;
      const s = String(value).trim();
      return s === '' ? null : s;
    }
  }
}

function isMissing(value: unknown, field: Field): boolean {
  if (field.type.startsWith('i18n')) {
    // o'zbekcha (asosiy til) majburiy
    return !(value as Record<string, string>)?.uz;
  }
  return value === null || value === undefined || value === '';
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  values: Values,
  attachments: AttachmentInput[] = [],
): Promise<ActionResult> {
  const { supabase, user, profile } = await requireStaff();
  const res = RESOURCES[resourceKey];
  if (!res) return { error: "Noma'lum bo'lim" };

  const sites = allowedSites(profile.role);
  if (res.mainOnly && !sites.includes('main')) return { error: "Bu bo'limga ruxsatingiz yo'q" };

  const payload: Values = {};
  for (const f of res.fields) {
    if (f.name in values) payload[f.name] = normalizeValue(values[f.name], f);
  }

  for (const f of res.fields) {
    if (f.required && isMissing(payload[f.name], f)) {
      const suffix = f.type.startsWith('i18n') ? " (o'zbekcha)" : '';
      return { error: `"${f.label}"${suffix} to'ldirilishi shart` };
    }
  }

  if (res.hasSite && !sites.includes(String(payload.site) as 'main' | 'talimsifati')) {
    return { error: "Tanlangan saytga yozish huquqingiz yo'q" };
  }

  // Slug: bo'sh bo'lsa sarlavhadan hosil qilinadi
  const slugField = res.fields.find((f) => f.type === 'slug');
  let slugAuto = false;
  if (slugField) {
    const given = typeof payload[slugField.name] === 'string' ? slugify(String(payload[slugField.name])) : '';
    if (given) {
      payload[slugField.name] = given;
    } else {
      const source = slugField.from ? (payload[slugField.from] as Record<string, string> | undefined) : undefined;
      payload[slugField.name] = slugify(source?.uz ?? '') || `item-${randomSuffix()}`;
      slugAuto = !id;
    }
  }

  // Vaqt qoidalari
  if (resourceKey === 'posts' && payload.status === 'published' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }
  if (resourceKey === 'albums' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  let recordId = id;
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (id) {
      const { data, error } = await supabase.from(res.table).update(payload).eq('id', id).select('id');
      if (error) lastError = error;
      else if (!data || data.length === 0) {
        return { error: "Saqlab bo'lmadi: yozuv topilmadi yoki ruxsatingiz yo'q" };
      } else lastError = null;
    } else {
      const insertPayload = res.setCreatedBy ? { ...payload, created_by: user.id } : payload;
      const { data, error } = await supabase.from(res.table).insert(insertPayload).select('id').single();
      if (error) lastError = error;
      else {
        recordId = data.id as string;
        lastError = null;
      }
    }

    if (lastError?.code === '23505' && slugField && slugAuto && attempt === 0) {
      // Avtomatik yaratilgan slug band bo'lsa, suffiks qo'shib qayta urinamiz
      payload[slugField.name] = `${String(payload[slugField.name])}-${randomSuffix()}`;
      continue;
    }
    break;
  }

  if (lastError) {
    if (lastError.code === '23505') return { error: 'Bunday havola (slug) allaqachon mavjud. Boshqasini tanlang.' };
    return { error: `Saqlashda xatolik: ${lastError.message}` };
  }
  if (!recordId) return { error: "Saqlashda noma'lum xatolik" };

  // Biriktirmalar (rasm/video/fayl): faqat o'zgargan qatorlar yangilanadi
  if (res.attachments) {
    const cfg = res.attachments;
    const clean = attachments
      .filter((a) => a.url && /^https?:\/\//i.test(a.url) && cfg.kinds.includes(a.kind))
      .map((a, index) => ({
        id: a.id,
        row: {
          [cfg.fk]: recordId,
          kind: a.kind,
          url: a.url,
          [cfg.textField]: a.text?.trim() || null,
          sort_order: index,
        },
      }));

    const { data: existing, error: exErr } = await supabase.from(cfg.table).select('id').eq(cfg.fk, recordId);
    if (exErr) return { error: `Biriktirmalarni o'qishda xatolik: ${exErr.message}` };

    const keepIds = new Set(clean.map((c) => c.id).filter(Boolean) as string[]);
    const removeIds = (existing ?? []).map((r) => r.id as string).filter((x) => !keepIds.has(x));
    if (removeIds.length) {
      const { error } = await supabase.from(cfg.table).delete().in('id', removeIds);
      if (error) return { error: `Biriktirmani o'chirishda xatolik: ${error.message}` };
    }

    for (const item of clean) {
      const { error } = item.id
        ? await supabase.from(cfg.table).update(item.row).eq('id', item.id)
        : await supabase.from(cfg.table).insert(item.row);
      if (error) return { error: `Biriktirmani saqlashda xatolik: ${error.message}` };
    }
  }

  refreshPublic();
  return { ok: true, id: recordId };
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const res = RESOURCES[resourceKey];
  if (!res) return { error: "Noma'lum bo'lim" };

  const { data, error } = await supabase.from(res.table).delete().eq('id', id).select('id');
  if (error) return { error: `O'chirishda xatolik: ${error.message}` };
  if (!data || data.length === 0) return { error: "O'chirib bo'lmadi: ruxsat yo'q yoki topilmadi" };

  refreshPublic();
  return { ok: true };
}

export async function signOut() {
  const { supabase } = await getSessionProfile();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

const ROLES: AppRole[] = ['pending', 'editor', 'quality_editor', 'super_admin'];

export async function updateUserRole(userId: string, role: string): Promise<ActionResult> {
  const { supabase, user } = await requireSuperAdmin();
  if (!ROLES.includes(role as AppRole)) return { error: "Noto'g'ri rol" };
  if (userId === user.id) return { error: "O'z rolingizni o'zgartira olmaysiz (tizimdan chiqib ketmaslik uchun)" };

  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: 'Foydalanuvchi topilmadi' };
  return { ok: true };
}

const SETTING_KEYS = ['contact', 'socials', 'hero', 'stats'] as const;

export async function saveSetting(site: string, key: string, value: Record<string, unknown>): Promise<ActionResult> {
  const { supabase, profile } = await requireStaff();
  if (site !== 'main' && site !== 'talimsifati') return { error: "Noto'g'ri sayt" };
  if (!allowedSites(profile.role).includes(site)) return { error: "Bu saytga ruxsatingiz yo'q" };
  if (!(SETTING_KEYS as readonly string[]).includes(key)) return { error: "Noma'lum sozlama" };

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') {
      if (v.trim()) clean[k] = v.trim();
    } else if (v && typeof v === 'object') {
      const i18n = normalizeI18n(v);
      if (Object.keys(i18n).length) clean[k] = i18n;
    }
  }

  const { error } = await supabase.from('site_settings').upsert({ site, key, value: clean }, { onConflict: 'site,key' });
  if (error) return { error: error.message };

  refreshPublic();
  return { ok: true };
}
