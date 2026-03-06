import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const malinton = localFont({
  src: [
    {
      path: "../../fonts/MalintonTrialVersion-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/MalintonTrialVersion-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/MalintonTrialVersion-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-malinton",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clink — Show up. Get rewarded.",
    template: "%s | Clink",
  },
  description:
    "An event platform that solves the no-show problem and rewards people who actually show up. Check in at events, build your on-chain reputation, and unlock better experiences. Built on Arkiv.",
  keywords: ["events", "event platform", "on-chain", "reputation", "Arkiv", "attendance", "RSVP", "check-in"],
  authors: [{ name: "Clink" }],
  creator: "Clink",
  openGraph: {
    type: "website",
    title: "Clink — Show up. Get rewarded.",
    description: "An event platform that solves the no-show problem and rewards people who actually show up. Built on Arkiv.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clink — Show up. Get rewarded.",
    description: "An event platform that solves the no-show problem and rewards people who actually show up. Built on Arkiv.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

import { MobileNav } from "@/components/mobile-nav";
import { PageTransition } from "@/components/page-transition";
import Ribbons from "@/components/ribbons";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${malinton.variable} font-sans antialiased pb-20 md:pb-0 min-h-screen flex flex-col relative`}
      >
        <div
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <Ribbons
            baseThickness={40}
            colors={["#FF52A2", "#eeeeee"]}
            speedMultiplier={0.52}
            maxAge={500}
            enableFade={false}
            enableShaderEffect={false}
          />
        </div>
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <Providers>
            <PageTransition>
              {children}
            </PageTransition>
            <MobileNav />
          </Providers>
        </div>
      </body>
    </html>
  );
}
