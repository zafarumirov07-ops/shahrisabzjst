import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from '@/app/admin/actions';
import Icon, { type IconName } from '@/components/Icon';
import { LogoMark } from '@/components/site/Header';
import { allowedSites, getSessionProfile, isStaffRole } from '@/lib/admin/auth';
import { ROLE_LABELS } from '@/lib/admin/roles';
import { siteUrl } from '@/lib/site';

type NavLink = { href: string; label: string; icon: IconName };

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { profile } = await getSessionProfile();
  const staff = isStaffRole(profile.role);
  const sites = allowedSites(profile.role);
  const hasMain = sites.includes('main');

  const nav: NavLink[] = [{ href: '/admin', label: 'Bosh sahifa', icon: 'grid' }];
  if (staff) {
    nav.push(
      { href: '/admin/r/posts', label: 'Postlar', icon: 'newspaper' },
      { href: '/admin/r/events', label: 'Tadbirlar', icon: 'calendar' },
      { href: '/admin/r/albums', label: 'Galereya', icon: 'image' },
      { href: '/admin/r/staff', label: 'Jamoa', icon: 'users' },
    );
    if (hasMain) {
      nav.push(
        { href: '/admin/r/programs', label: "Qabul yo'nalishlari", icon: 'graduation' },
        { href: '/admin/r/departments', label: "Bo'limlar", icon: 'building' },
      );
    }
    nav.push(
      { href: '/admin/r/pages', label: 'Sahifalar', icon: 'file' },
      { href: '/admin/media', label: 'Media kutubxonasi', icon: 'folder' },
      { href: '/admin/settings', label: 'Sayt sozlamalari', icon: 'info' },
    );
  }
  if (profile.role === 'super_admin') {
    nav.push(
      { href: '/admin/users', label: 'Foydalanuvchilar', icon: 'user' },
      { href: '/admin/audit', label: 'Tahrir tarixi', icon: 'history' },
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass border-b border-line lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 p-4 lg:p-5">
          <LogoMark className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Admin panel</p>
            <p className="text-xs text-muted">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-4" aria-label="Admin">
          {nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-[14.5px] font-medium text-fg transition hover:bg-[var(--accent-soft)] hover:text-accent"
            >
              <Icon name={l.icon} className="h-5 w-5 text-accent" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden p-4 text-sm lg:block" style={{ borderTop: '0.5px solid var(--line)' }}>
          {sites.map((s) => (
            <a key={s} href={siteUrl(s, 'uz')} target="_blank" rel="noreferrer" className="link flex items-center gap-1 py-1">
              {s === 'main' ? 'Asosiy saytni ko‘rish' : 'Ta’lim sifati saytini ko‘rish'}
              <Icon name="arrow-up-right" className="h-3.5 w-3.5" />
            </a>
          ))}
          <p className="mt-3 truncate text-xs text-muted" title={profile.email ?? ''}>
            {profile.email}
          </p>
          <form action={signOut}>
            <button type="submit" className="btn-outline mt-2 w-full">
              <Icon name="logout" className="h-[18px] w-[18px]" />
              Chiqish
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-3 border-b border-line bg-surface px-4 py-2 text-sm lg:hidden">
          <span className="truncate text-muted">{profile.email}</span>
          <form action={signOut}>
            <button type="submit" className="btn-outline !px-3 !py-1.5">
              <Icon name="logout" className="h-4 w-4" />
              Chiqish
            </button>
          </form>
        </div>
        <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
          {staff ? (
            children
          ) : (
            <div className="card p-8 text-center">
              <h1 className="text-xl font-bold">Ruxsat kutilmoqda</h1>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Hisobingiz ({profile.email}) yaratilgan, lekin hali rol berilmagan. Bosh admin sizga huquq berganidan keyin sahifani yangilang.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
