import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "拾光信箱 · 匿名提问箱",
  description:
    "有些话，不必署名。在这里留下一句想问的，我会一封一封读，慢慢回。",
  openGraph: {
    title: "拾光信箱 · 匿名提问箱",
    description: "有些话，不必署名。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1e6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="grain min-h-dvh antialiased">{children}</body>
    </html>
  );
}
