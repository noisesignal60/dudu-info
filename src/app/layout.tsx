import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_TC({
  variable: "--font-noto-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "嘟嘟資訊網",
  description: "嘟嘟資訊網 - 分潤系統",
  applicationName: "嘟嘟資訊網",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06C755",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 text-base">
        {children}
      </body>
    </html>
  );
}
