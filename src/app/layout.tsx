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
  title: "Clink — Show up. Get rewarded.",
  description:
    "An event platform that solves the no-show problem and rewards people who actually show up — built on Arkiv.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${malinton.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
