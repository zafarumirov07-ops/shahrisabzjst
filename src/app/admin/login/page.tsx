import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/SmallClient';
import { LogoMark } from '@/components/site/Header';
import { adminLoginConfigured, readSession } from '@/lib/admin/session';
import { adminDbConfigured } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Kirish' };

export default async function LoginPage() {
  const configured = adminLoginConfigured() && adminDbConfigured();
  if (configured && (await readSession())) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="h-16 w-16" />
          <h1 className="mt-4 text-xl font-bold">Admin panel</h1>
          <p className="mt-1 text-sm text-muted">Abu Ali ibn Sino nomidagi jamoat salomatligi texnikumi</p>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700">
            <p className="font-semibold">Admin kirishi sozlanmagan.</p>
            <p className="mt-1">
              Vercel, Settings, Environment Variables bo‘limida <code>ADMIN_LOGIN</code>, <code>ADMIN_PASSWORD</code> va{' '}
              <code>SUPABASE_SECRET_KEY</code> ni kiriting, so‘ng Redeploy qiling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
