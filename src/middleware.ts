import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { siteFromHost } from '@/lib/site';

/**
 * 1) /admin/*  -> hosti qanday bo'lmasin admin panelga o'tkaziladi (sessiya yangilanadi)
 * 2) Til prefiksi yo'q yo'llar  /uz/... ga yo'naltiriladi
 * 3) Host bo'yicha sayt aniqlanadi (talimsifati.* -> "talimsifati", qolgani -> "main")
 *    va so'rov ichki ravishda  /{site}/{locale}/...  ga rewrite qilinadi.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return updateSession(request);
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const site = siteFromHost(host);

  const segments = pathname.split('/');
  const first = segments[1];

  if (!isLocale(first)) {
    const preferred = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = isLocale(preferred) ? preferred : DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${site}${pathname}`;
  const response = NextResponse.rewrite(url);
  response.cookies.set('NEXT_LOCALE', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return response;
}

export const config = {
  // _next, api va fayl kengaytmali yo'llar (favicon.ico, robots.txt ...) middleware dan o'tmaydi
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
