import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PaperScene } from "@/components/paper-scene";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "尺素 · 不必具名",
  description:
    "有言欲问，不必具名。世路匆忙，容我逐函细读，徐徐作复。",
  openGraph: {
    title: "尺素 · 不必具名",
    description: "见字如面，纸短情长。凡有所书，皆郑重受之。",
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
    var root = document.documentElement;
    var mode = localStorage.getItem('qasys-theme-mode');
    if (mode === 'system') mode = 'clock';
    if (mode !== 'day' && mode !== 'night' && mode !== 'clock') {
      var legacy = localStorage.getItem('qasys-theme');
      mode = (legacy === 'day' || legacy === 'night') ? legacy : 'clock';
    }
    var tone;
    if (mode === 'day' || mode === 'night') {
      tone = mode;
    } else {
      var hour = new Date().getHours();
      tone = (hour >= 18 || hour < 7) ? 'night' : 'day';
    }
    if (tone === 'night') {
      root.setAttribute('data-theme', 'night');
    } else {
      root.removeAttribute('data-theme');
    }
    if (localStorage.getItem('qasys-motion') === 'still') {
      root.setAttribute('data-motion', 'still');
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
        {/* 首屏关键渲染路径：核心画心与字阶预加载，消除 FOUT 与加载抖动 */}
        <link
          rel="preload"
          href="/screen/byobu.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/fonts/v1/ui-song.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/v1/ui-kai.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="grain min-h-dvh antialiased">
        <PaperScene />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
