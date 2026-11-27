// Skriptlar uchun umumiy yordamchilar: .env o'qish, Supabase klienti, argumentlar, parallel ishlov.
// Maxfiy kalitlar hech qachon chop etilmaydi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** .env (asosiy fayl) va bo'lsa .env.local (ustun turadi, Next.js dagi kabi) */
export function loadEnv() {
  const out = {};
  for (const name of ['.env', '.env.local']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (/^[A-Z_0-9]+=/.test(l)) out[l.slice(0, l.indexOf('='))] = l.slice(l.indexOf('=') + 1).trim();
    }
  }
  return out;
}

export const env = { ...loadEnv(), ...process.env };

export function getDb() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SECRET_KEY .env da bo‘lishi kerak');
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
}

/** --apply berilmasa hech narsa yozilmaydi (dry-run) */
export const args = process.argv.slice(2);
export const APPLY = args.includes('--apply');
export const flag = (name) => args.includes(`--${name}`);
export const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

export async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx], idx);
      }
    }),
  );
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Barcha qatorlarni sahifalab o'qiydi (PostgREST 1000 qator limiti) */
export async function fetchAll(db, table, columns = '*', build = (q) => q) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(db.from(table).select(columns)).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}
