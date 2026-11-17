import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config';
import { QUALITY_SLUG, siteFromHost } from '@/lib/site';

/**
 * 1) /admin/*            -> admin panel (kirish serverda tekshiriladi)
 * 2) /talimsifati/uz/... -> "Ta'lim sifati" sayti, domensiz (har qanday hostda ishlaydi)
 * 3) Til prefiksi yo'q yo'llar  /uz/... ga yo'naltiriladi
 * 4) Host bo'yicha sayt aniqlanadi (talimsifati.* -> "talimsifati", qolgani -> "main")
 *    va so'rov ichki ravishda  /{site}/{locale}/...  ga rewrite qilinadi.
 */
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get('NEXT_LOCALE')?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}

function rememberLocale(response: NextResponse, locale: string) {
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');

  // Domensiz rejim: /talimsifati/{locale}/... ichki marshrut bilan bir xil, shuning uchun o'zgartirmasdan o'tkaziladi
  if (segments[1] === QUALITY_SLUG) {
    const locale = segments[2];
    if (!isLocale(locale)) {
      const rest = segments.slice(2).filter(Boolean).join('/');
      const url = request.nextUrl.clone();
      url.pathname = `/${QUALITY_SLUG}/${preferredLocale(request)}${rest ? `/${rest}` : ''}`;
      return NextResponse.redirect(url);
    }
    return rememberLocale(NextResponse.next(), locale);
  }

  const first = segments[1];
  if (!isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const site = siteFromHost(host);
  const url = request.nextUrl.clone();
  url.pathname = `/${site}${pathname}`;
  return rememberLocale(NextResponse.rewrite(url), first);
}

export const config = {
  // _next, api va fayl kengaytmali yo'llar (favicon.ico, robots.txt ...) middleware dan o'tmaydi
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
