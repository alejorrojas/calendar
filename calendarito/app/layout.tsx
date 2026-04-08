import type { Metadata } from "next";
import { Poppins, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://calendarito.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Calendarito",
  description: "Turn natural language, files, PDFs, and images into Google Calendar events.",
  openGraph: {
    title: "Calendarito",
    description: "Turn natural language, files, PDFs, and images into Google Calendar events.",
    url: siteUrl,
    siteName: "Calendarito",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Calendarito – Drop or type anything, get events in your Calendar",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calendarito",
    description: "Turn natural language, files, PDFs, and images into Google Calendar events.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", poppins.variable, inter.variable, "font-sans", geist.variable)}>
      <body className="font-body min-h-full flex flex-col text-[var(--text)]">{children}</body>
    </html>
  );
}
