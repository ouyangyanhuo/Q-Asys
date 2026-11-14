import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AmbientLight } from "@/components/ambient-light";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "拾光信箱 · 匿名提问箱",
  description:
    "有些话，不必署名。在这里留下一句想问的，我会一封一封读，慢慢回。",
  openGraph: {
    title: "拾光信箱 · 匿名提问箱",
    description: "有些话，不必署名。留下一封信，等一束微光与回音。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

const THEME_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('qasys-theme');
    var isDark = stored === 'night' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'night');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="grain min-h-dvh antialiased">
        <AmbientLight />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
