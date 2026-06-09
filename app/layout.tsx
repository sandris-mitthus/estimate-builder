import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AppNav } from "@/app/components/app-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estimate Builder",
  description: "Tāmes piedāvājumu veidošana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lv" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
