import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Nunito, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "懒猫小屋 · Lazy Cat Den",
  description: "A tiny shared room for two — Q&A, draws, wishlist, and a lazy cat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbf6f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${nunito.variable} ${noto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
