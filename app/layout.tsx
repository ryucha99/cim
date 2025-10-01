import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CIM - 체크인 매니지먼트",
  description: "출결 웹앱",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b1b3b",
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "CIM", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const SKIN = process.env.NEXT_PUBLIC_SKIN || 'glass';
  return (
    <html lang="ko">
      <body
        data-skin={SKIN}
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
