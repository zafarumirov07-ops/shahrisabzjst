import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../../globals.css';
import Footer from '@/components/site/Footer';
import Header from '@/components/site/Header';
import ViewTracker from '@/components/site/ViewTracker';
import { getCtx, type SiteParams } from '@/lib/ctx';
import { getSettings } from '@/lib/data';
import { sans } from '@/lib/fonts';
import { HTML_LANG, LOCALES, type Locale } from '@/lib/i18n/config';
import { ROOT_DOMAIN, homeHref } from '@/lib/site';

const OG_LOCALE: Record<Locale, string> = { uz: 'uz_UZ', oz: 'uz_UZ', ru: 'ru_RU', en: 'en_GB' };

// Brauzer saqlangan sozlamalarni (shrift, kontrast, qorong'u rejim) sahifa chizilishidan oldin qo'llaydi
const themeScript = `(function(){document.documentElement.classList.add('js');try{var s=JSON.parse(localStorage.getItem('a11y')||'{}');var e=document.documentElement;if(s.fs>0)e.setAttribute('data-fs',s.fs);if(s.contrast)e.setAttribute('data-contrast','high');if(s.dark)e.setAttribute('data-theme','dark');}catch(_){}})();`;

// Har ikkala sayt va uchala til oldindan tayyorlanadi; qolgan sahifalar birinchi so'rovda keshlanadi (ISR)
export function generateStaticParams() {
  return (['main', 'talimsifati'] as const).flatMap((site) => LOCALES.map((locale) => ({ site, locale })));
}

export async function generateMetadata({ params }: { params: SiteParams }): Promise<Metadata> {
  const { site, locale, dict } = await getCtx(params);
  const name = site === 'talimsifati' ? `${dict.qualitySiteName} | ${dict.siteShort}` : dict.siteName;
  const protocol = ROOT_DOMAIN.startsWith('localhost') ? 'http' : 'https';
  return {
    metadataBase: new URL(`${protocol}://${ROOT_DOMAIN}`),
    title: { default: name, template: `%s | ${dict.siteShort}` },
    description: dict.home.heroSubtitle,
    openGraph: {
      title: name,
      description: dict.home.heroSubtitle,
      locale: OG_LOCALE[locale],
      type: 'website',
      siteName: dict.siteShort,
    },
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], homeHref(site, l)])) },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: SiteParams;
}) {
  const { site, locale, dict } = await getCtx(params);
  const settings = await getSettings(site);

  return (
    <html lang={HTML_LANG[locale]} className={sans.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-[var(--accent-fg)]"
        >
          {dict.a11y.skip}
        </a>
        <Header site={site} locale={locale} dict={dict} />
        <main id="main">{children}</main>
        <Footer site={site} locale={locale} dict={dict} settings={settings} />
        <ViewTracker site={site} />
      </body>
    </html>
  );
}
