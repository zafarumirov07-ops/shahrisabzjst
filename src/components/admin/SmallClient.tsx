'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useState, useTransition } from 'react';
import { deleteRecord, login, type LoginState } from '@/app/admin/actions';

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

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="login" className="label">Login</label>
        <input id="login" name="login" type="text" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Parol</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? 'Kirilmoqda…' : 'Kirish'}
      </button>
    </form>
  );
}
