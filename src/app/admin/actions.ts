'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { allowedSites, requireStaff } from '@/lib/admin/auth';
import { applyAutoTranslate } from '@/lib/admin/auto-translate';
import { createSession, destroySession, verifyCredentials } from '@/lib/admin/session';
import { RESOURCES, SOCIAL_KEYS, type Field } from '@/lib/admin/resources';
import type { MediaRow } from '@/lib/admin/upload';
import { LOCALES } from '@/lib/i18n/config';
import { slugify } from '@/lib/utils';

export type ActionResult = { ok?: boolean; error?: string; id?: string; warning?: 'quota' | 'error' };

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
    // kamida bitta tilda matn bo'lishi shart (qolganlari avtomatik to'ldiriladi)
    return !Object.values((value as Record<string, string>) ?? {}).some(Boolean);
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
  options: { autoTranslate?: boolean } = {},
): Promise<ActionResult> {
  const { supabase, profile } = await requireStaff();
  const res = RESOURCES[resourceKey];
  if (!res) return { error: "Noma'lum bo'lim" };

  const sites = allowedSites(profile.role);
  if (res.mainOnly && !sites.includes('main')) return { error: "Bu bo'limga ruxsatingiz yo'q" };

  const payload: Values = {};
  for (const f of res.fields) {
    if (f.name in values) payload[f.name] = normalizeValue(values[f.name], f);
  }
  // Bo'lim turini (masalan posts.kind) forma emas, server belgilaydi
  if (res.fixed) Object.assign(payload, res.fixed);

  for (const f of res.fields) {
    if (f.required && isMissing(payload[f.name], f)) {
      const suffix = f.type.startsWith('i18n') ? " (kamida bitta tilda)" : '';
      return { error: `"${f.label}"${suffix} to'ldirilishi shart` };
    }
  }

  if (res.hasSite && !sites.includes(String(payload.site) as 'main' | 'talimsifati')) {
    return { error: "Tanlangan saytga yozish huquqingiz yo'q" };
  }

  // Bo'sh tillarni avtomatik to'ldirish (mavjud yozuv bilan solishtiriladi)
  const i18nNames = res.fields.filter((f) => f.type.startsWith('i18n')).map((f) => f.name);
  let existing: Record<string, unknown> | null = null;
  let autoSupported = true;
  if (id && i18nNames.length) {
    let r = await supabase.from(res.table).select([...i18nNames, 'auto_langs'].join(',')).eq('id', id).maybeSingle();
    if (r.error) {
      autoSupported = false; // auto_langs ustuni hali yo'q (migratsiya ishga tushirilmagan)
      r = await supabase.from(res.table).select(i18nNames.join(',')).eq('id', id).maybeSingle();
    }
    existing = (r.data as unknown as Record<string, unknown>) ?? null;
  }
  const auto = await applyAutoTranslate(res, payload, existing, options.autoTranslate !== false);
  if (i18nNames.length && autoSupported) payload.auto_langs = auto.autoLangs;

  // Slug: bo'sh bo'lsa sarlavhadan hosil qilinadi
  const slugField = res.fields.find((f) => f.type === 'slug');
  let slugAuto = false;
  if (slugField) {
    const given = typeof payload[slugField.name] === 'string' ? slugify(String(payload[slugField.name])) : '';
    if (given) {
      payload[slugField.name] = given;
    } else {
      const source = slugField.from ? (payload[slugField.from] as Record<string, string> | undefined) : undefined;
      payload[slugField.name] = slugify(source?.uz || source?.ru || source?.en || '') || `item-${randomSuffix()}`;
      slugAuto = !id;
    }
  }

  // Vaqt qoidalari
  // posts jadvalidagi barcha bo'limlar (Postlar, Elektron kutubxona, RTR): sana bo'sh bo'lsa saytda ko'rinmaydi
  if (res.table === 'posts' && payload.status === 'published' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }
  if (resourceKey === 'albums' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  let recordId = id;
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (id) {
      let upd = supabase.from(res.table).update(payload).eq('id', id);
      if (res.scope) upd = upd.in(res.scope.field, res.scope.values);
      const { data, error } = await upd.select('id');
      if (error) lastError = error;
      else if (!data || data.length === 0) {
        return { error: "Saqlab bo'lmadi: yozuv topilmadi yoki ruxsatingiz yo'q" };
      } else lastError = null;
    } else {
      const { data, error } = await supabase.from(res.table).insert(payload).select('id').single();
      if (error) lastError = error;
      else {
        recordId = data.id as string;
        lastError = null;
      }
    }

    if (lastError && 'auto_langs' in payload && /auto_langs/.test(lastError.message)) {
      delete payload.auto_langs; // migratsiya hali ishga tushirilmagan: belgisiz saqlaymiz
      continue;
    }
    if (lastError?.code === '23505' && slugField && slugAuto && attempt < 2) {
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
    const known = new Set((existing ?? []).map((r) => r.id as string));
    // id si bor va bazada mavjud qatorlar bitta upsert bilan, yangilari bitta insert bilan, o'chirish ham shu vaqtda
    const toUpdate = clean.filter((c) => c.id && known.has(c.id)).map((c) => ({ id: c.id, ...c.row }));
    const toInsert = clean.filter((c) => !c.id || !known.has(c.id)).map((c) => c.row);

    const results = await Promise.all([
      removeIds.length ? supabase.from(cfg.table).delete().in('id', removeIds) : null,
      toUpdate.length ? supabase.from(cfg.table).upsert(toUpdate, { onConflict: 'id' }) : null,
      toInsert.length ? supabase.from(cfg.table).insert(toInsert) : null,
    ]);
    const failed = results.find((r) => r?.error);
    if (failed?.error) return { error: `Biriktirmani saqlashda xatolik: ${failed.error.message}` };
  }

  refreshPublic();
  return { ok: true, id: recordId, warning: auto.warning };
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const res = RESOURCES[resourceKey];
  if (!res) return { error: "Noma'lum bo'lim" };

  let del = supabase.from(res.table).delete().eq('id', id);
  if (res.scope) del = del.in(res.scope.field, res.scope.values);
  const { data, error } = await del.select('id');
  if (error) return { error: `O'chirishda xatolik: ${error.message}` };
  if (!data || data.length === 0) return { error: "O'chirib bo'lmadi: ruxsat yo'q yoki topilmadi" };

  refreshPublic();
  return { ok: true };
}

export async function signOut() {
  await destroySession();
  redirect('/admin/login');
}

// ---------- Kirish (login/parol Vercel env dan) ----------
export type LoginState = { error?: string };

// Oddiy urinishlarni cheklash (bitta server nusxasi ichida): 10 daqiqada 8 ta xato urinish
const attempts = new Map<string, { count: number; first: number }>();

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first < 10 * 60 * 1000 && rec.count >= 8) {
    return { error: "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring." };
  }

  const loginName = String(formData.get('login') ?? '');
  const password = String(formData.get('password') ?? '');
  const user = verifyCredentials(loginName, password);

  if (!user) {
    const fresh = rec && now - rec.first < 10 * 60 * 1000 ? rec : { count: 0, first: now };
    attempts.set(ip, { count: fresh.count + 1, first: fresh.first });
    await new Promise((r) => setTimeout(r, 700)); // brute-force ni sekinlashtirish
    return { error: "Login yoki parol noto'g'ri" };
  }

  attempts.delete(ip);
  await createSession(user);
  redirect('/admin');
}

// ---------- Media: serverdan imzolangan yuklash (brauzerda Supabase sessiyasi yo'q) ----------
const MAX_UPLOAD = 50 * 1024 * 1024;
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
];

export async function createUploadTarget(
  fileName: string,
  mime: string,
  size: number,
): Promise<{ error?: string; path?: string; token?: string }> {
  const { supabase } = await requireStaff();
  if (size > MAX_UPLOAD) return { error: 'Fayl 50 MB dan katta' };
  if (!ALLOWED_MIME.includes(mime)) return { error: `Bu fayl turi (${mime || 'noma‘lum'}) ruxsat etilmagan` };

  const now = new Date();
  const ext = (fileName.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const base = slugify(fileName.replace(/\.[^.]+$/, '')) || 'file';
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Math.random()
    .toString(36)
    .slice(2, 10)}-${base}.${ext}`;

  const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(path);
  if (error || !data) return { error: `Yuklash manzilini olishda xatolik: ${error?.message}` };
  return { path, token: data.token };
}

export async function registerMedia(input: {
  path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  kind: 'image' | 'video' | 'file';
}): Promise<{ error?: string; row?: MediaRow }> {
  const { supabase } = await requireStaff();
  if (!/^\d{4}\/\d{2}\/[a-z0-9-]+\.[a-z0-9]+$/.test(input.path)) return { error: "Noto'g'ri fayl yo'li" };

  const { data: pub } = supabase.storage.from('media').getPublicUrl(input.path);
  const { data, error } = await supabase
    .from('media')
    .insert({
      path: input.path,
      url: pub.publicUrl,
      name: input.name.slice(0, 200),
      mime_type: input.mime_type || null,
      size_bytes: input.size_bytes,
      kind: input.kind,
    })
    .select('*')
    .single();
  if (error || !data) return { error: `Kutubxonaga yozishda xatolik: ${error?.message}` };
  return { row: data as MediaRow };
}

export async function listMedia(kind: 'image' | 'video' | 'file'): Promise<{ error?: string; rows: MediaRow[] }> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('kind', kind)
    .order('created_at', { ascending: false })
    .limit(120);
  if (error) return { error: error.message, rows: [] };
  return { rows: (data ?? []) as MediaRow[] };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const { data: row } = await supabase.from('media').select('path').eq('id', id).maybeSingle();
  if (!row) return { error: 'Fayl topilmadi' };
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) return { error: error.message };
  await supabase.storage.from('media').remove([row.path as string]);
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
