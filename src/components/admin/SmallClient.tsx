'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteRecord, updateUserRole } from '@/app/admin/actions';
import { ROLE_LABELS, type AppRole } from '@/lib/admin/roles';
import { createClient } from '@/lib/supabase/client';

export function DeleteButton({ resourceKey, id, label }: { resourceKey: string; id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg px-2.5 py-1 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(`"${label}" o‘chirilsinmi? Bu amalni qaytarib bo‘lmaydi.`)) return;
          setError(null);
          startTransition(async () => {
            const res = await deleteRecord(resourceKey, id);
            if (res.error) setError(res.error);
            else router.refresh();
          });
        }}
      >
        {pending ? '…' : 'O‘chirish'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </>
  );
}

export function RoleSelect({ userId, role, isSelf }: { userId: string; role: AppRole; isSelf: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState<AppRole>(role);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        className="input !w-auto !py-1.5"
        value={value}
        disabled={pending || isSelf}
        title={isSelf ? "O'z rolingizni o'zgartira olmaysiz" : undefined}
        onChange={(e) => {
          const next = e.target.value as AppRole;
          setMsg(null);
          startTransition(async () => {
            const res = await updateUserRole(userId, next);
            if (res.error) setMsg(res.error);
            else {
              setValue(next);
              setMsg('Saqlandi');
              router.refresh();
            }
          });
        }}
      >
        {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    if (err) {
      setError("Email yoki parol noto'g'ri");
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="label">Parol</label>
        <input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? 'Kirilmoqda…' : 'Kirish'}
      </button>
    </form>
  );
}
