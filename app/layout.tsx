import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.systemName,
    description: settings.slogan,
    openGraph: {
      title: settings.systemName,
      description: settings.slogan,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        <FeedbackToastProvider>{children}</FeedbackToastProvider>
      </body>
    </html>
  );
}
