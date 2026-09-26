import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PwaRegister } from "@/components/PwaRegister";
import { SITE } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PaperRaj — School Question Papers",
    template: "%s · PaperRaj",
  },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/manifest.webmanifest",
  keywords: [
    "school question papers",
    "previous year papers",
    "specimen papers",
    "exam papers",
    "ICSE",
    "CBSE",
    "study archive",
  ],
  authors: [{ name: SITE.ownerName }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "PaperRaj — School Question Papers",
    description: SITE.description,
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PaperRaj" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaperRaj — School Question Papers",
    description: SITE.description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/paperraj-icon.png", type: "image/svg+xml" },
      { url: "/paperraj-icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/paperraj-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2e9d8" },
    { media: "(prefers-color-scheme: dark)", color: "#553a22" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Spectral:ital,wght@0,300;0,400;0,500;1,400&display=swap"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PaperRaj" />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-card focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="paperraj-main mx-auto w-full max-w-[1180px] px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
          {children}
        </main>
        <SiteFooter />
        <PwaRegister />
      </body>
    </html>
  );
}
