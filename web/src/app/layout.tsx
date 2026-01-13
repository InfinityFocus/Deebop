import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import { PWAInstallPrompt } from "@/components/pwa";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Deebop",
    template: "%s | Deebop",
  },
  description: "Share images, videos, and 360 panoramas with the world",
  keywords: ["social media", "photos", "videos", "360 panorama", "sharing"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deebop",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen`}>
        <Providers>
          {children}
          <CookieConsentBanner />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
