import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "\uB80C\uB370\uBD80 \uC0AC\uC7A5\uB2D8 \uCEE8\uC194",
  description: "\uB80C\uB370\uBD80 \uB9E4\uC7A5 \uC6B4\uC601\uC744 \uC704\uD55C B2B \uCEE8\uC194",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


