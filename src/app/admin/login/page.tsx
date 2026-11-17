import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LogoMark } from '@/components/site/Header';
import { LoginForm } from '@/components/admin/SmallClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Kirish' };

export default async function LoginPage() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="mt-4 text-xl font-bold">Admin panel</h1>
          <p className="mt-1 text-sm text-muted">Abu Ali ibn Sino nomidagi jamoat salomatligi texnikumi</p>
        </div>
        {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
          <LoginForm />
        ) : (
          <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
            Supabase sozlanmagan. <code>.env.local</code> faylida NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY ni kiriting.
          </p>
        )}
      </div>
    </div>
  );
}
