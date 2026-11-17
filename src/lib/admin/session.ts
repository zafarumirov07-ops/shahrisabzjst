import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { AppRole } from '@/lib/admin/roles';

/**
 * Admin kirishi Vercel (yoki .env.local) dagi o'zgaruvchilar orqali:
 *   ADMIN_LOGIN / ADMIN_PASSWORD        -> bosh admin (hamma narsa)
 *   EDITOR_LOGIN / EDITOR_PASSWORD      -> ixtiyoriy: faqat asosiy sayt muharriri
 *   QUALITY_LOGIN / QUALITY_PASSWORD    -> ixtiyoriy: faqat "Ta'lim sifati" muharriri
 *   ADMIN_SESSION_SECRET                -> sessiya imzosi uchun uzun tasodifiy matn (tavsiya etiladi)
 */
export type SessionUser = { login: string; role: Exclude<AppRole, 'pending'> };

const COOKIE = 'admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 soat

type Account = { login: string; password: string; role: SessionUser['role'] };

function accounts(): Account[] {
  const list: Array<[string | undefined, string | undefined, SessionUser['role']]> = [
    [process.env.ADMIN_LOGIN, process.env.ADMIN_PASSWORD, 'super_admin'],
    [process.env.EDITOR_LOGIN, process.env.EDITOR_PASSWORD, 'editor'],
    [process.env.QUALITY_LOGIN, process.env.QUALITY_PASSWORD, 'quality_editor'],
  ];
  return list
    .filter(([l, p]) => Boolean(l && p))
    .map(([login, password, role]) => ({ login: login!, password: password!, role }));
}

export function adminLoginConfigured(): boolean {
  return accounts().length > 0;
}

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    crypto
      .createHash('sha256')
      .update(`${process.env.ADMIN_PASSWORD ?? ''}|${process.env.SUPABASE_SECRET_KEY ?? ''}|session`)
      .digest('hex')
  );
}

function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

function sameString(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Login/parol to'g'ri bo'lsa foydalanuvchini qaytaradi (vaqt bo'yicha xavfsiz solishtirish). */
export function verifyCredentials(login: string, password: string): SessionUser | null {
  let found: SessionUser | null = null;
  for (const acc of accounts()) {
    const okLogin = sameString(login.trim(), acc.login);
    const okPass = sameString(password, acc.password);
    if (okLogin && okPass && !found) found = { login: acc.login, role: acc.role };
  }
  return found;
}

export async function createSession(user: SessionUser): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ l: user.login, r: user.role, e: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
  ).toString('base64url');
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig || !sameString(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { l: string; r: SessionUser['role']; e: number };
    if (!data.l || data.e < Math.floor(Date.now() / 1000)) return null;
    // Hisob env dan olib tashlangan bo'lsa, eski sessiya ham o'chadi
    const acc = accounts().find((a) => a.login === data.l && a.role === data.r);
    return acc ? { login: acc.login, role: acc.role } : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, '', { httpOnly: true, path: '/admin', maxAge: 0 });
}
