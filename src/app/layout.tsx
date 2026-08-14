import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { LanguageProvider } from "@/context/LanguageContext";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Live Satta King | Today's Live Results & Charts",
    template: `%s | ${SITE_NAME}`,
  },
  description: "Check today's Satta King Result, historical charts, and old records on Live-SattaKing.com.",
  verification: {
    google: "iwfZBGPCqdL74ht1H9V0bVgdfHVKvW-qXETMj6c7_Uk",
  },

  keywords: [
    "live satta king",
    "live satta king result",
    "satta live result today",
    "satta king today result",
    "fast satta live result",
    "all satta bazar live result",
    "satta result live",
    "gali live result",
    "desawar live result",
    "gali today result",
    "desawer today result",
    "disawar satta live",
    "gali desawar live result",
    "shri ganesh satta king live",
    "delhi bazar live",
    "satta king chart live",
    "satta chart live",
    "satta record live",
    "monthly satta record chart 2026",
    "previous satta result",
    "smart satta king",
    "24 7 satta king",
    "online gali disawar",
    "black satta live result",
    "a7 satta",
    "satta king result",
    "satta king",
    "satta result",
    "gali result",
    "desawar result",
    "satta king 2026",
    "satta king live",
    "live satta result",
    "satta online result",
    "satta chart",
    "satta record",
    "disawar result today",
    "faridabad result today",
    "ghaziabad result today",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Live Satta King | Today's Live Results & Charts",
    description:
      "Check today's Satta King Result, Gali, Desawar, Faridabad and Ghaziabad results, charts, and old records.",
  },
  twitter: {
    card: "summary",
    title: "Live Satta King | Today's Live Results & Charts",
    description: "Check today's Satta King Result, historical charts, and old records on Live-SattaKing.com.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
