import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, { languageCode }] = await Promise.all([
    getSiteSettings(),
    getServerTranslations(),
  ]);
  const description =
    resolveLocalizedValue(settings.sloganValues, languageCode) ||
    settings.slogan;
  const icons = settings.faviconUrl
    ? {
        icon: [{ url: settings.faviconUrl }],
        shortcut: [settings.faviconUrl],
        apple: [{ url: settings.faviconUrl }],
      }
    : undefined;

  return {
    title: settings.systemName,
    description,
    icons,
    openGraph: {
      title: settings.systemName,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sīkdatņu piekrišana un kājene ir vajadzīgas arī publiskajās lapās, tāpēc
  // tulkojumi tiek ielādēti jau šeit, nevis tikai aizsargātajā layout.
  const { languageCode, translations } = await getServerTranslations();

  return (
    <html lang={languageCode} className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        <TranslationsProvider
          languageCode={languageCode}
          translations={translations}
        >
          <FeedbackToastProvider>
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </FeedbackToastProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
