/*
 * @Author: LiZhiWei
 * @Date: 2026-02-11 10:56:25
 * @LastEditors: LiZhiWei
 * @LastEditTime: 2026-02-11 14:25:09
 * @Description: 
 */
import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk, Press_Start_2P } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteDescription = "想法、代码与日常见闻的个人记录。";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Lee",
    template: "%s | Lee",
  },
  description: siteDescription,
  openGraph: {
    title: "Lee",
    description: siteDescription,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${hankenGrotesk.variable} ${geistMono.variable} ${pressStart.variable} font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
