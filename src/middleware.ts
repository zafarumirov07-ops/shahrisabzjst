import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { QUALITY_SLUG, siteFromHost } from '@/lib/site';

/**
 * 1) /admin/*              -> admin panel (kirish serverda tekshiriladi)
 * 2) /talimsifati/...      -> "Ta'lim sifati" sayti, domensiz (har qanday hostda ishlaydi)
 * 3) Til prefiksi yo'q yo'llar asosiy (lotin o'zbekcha) tilda ochiladi: /news  ->  ichki /main/uz/news
 *    Aniq prefiks (/oz, /ru, /en) shu tilni ochadi; /uz/... esa bitta kanonik manzil uchun prefikssizga yo'naltiriladi.
 * 4) Host bo'yicha sayt aniqlanadi (talimsifati.* -> "talimsifati", qolgani -> "main")
 *    va so'rov ichki ravishda  /{site}/{locale}/...  ga rewrite qilinadi.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');

  // Domensiz rejim: /talimsifati[/{locale}]/...
  if (segments[1] === QUALITY_SLUG) {
    const second = segments[2];
    const url = request.nextUrl.clone();
    if (isLocale(second)) {
      if (second === DEFAULT_LOCALE) {
        const rest = segments.slice(3).filter(Boolean).join('/');
        url.pathname = `/${QUALITY_SLUG}${rest ? `/${rest}` : ''}`;
        return NextResponse.redirect(url, 308);
      }
      return NextResponse.next(); // /talimsifati/ru/... ichki marshrut bilan bir xil
    }
    const rest = segments.slice(2).filter(Boolean).join('/');
    url.pathname = `/${QUALITY_SLUG}/${DEFAULT_LOCALE}${rest ? `/${rest}` : ''}`;
    return NextResponse.rewrite(url);
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const site = siteFromHost(host);
  const url = request.nextUrl.clone();
  const first = segments[1];

  if (isLocale(first)) {
    if (first === DEFAULT_LOCALE) {
      const rest = segments.slice(2).filter(Boolean).join('/');
      url.pathname = rest ? `/${rest}` : '/';
      return NextResponse.redirect(url, 308);
    }
    url.pathname = `/${site}${pathname}`;
    return NextResponse.rewrite(url);
  }

  url.pathname = `/${site}/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // _next, api va fayl kengaytmali yo'llar (favicon.ico, robots.txt ...) middleware dan o'tmaydi
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
