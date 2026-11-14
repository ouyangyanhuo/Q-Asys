"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"day" | "night">("day");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 优先读取已由 head 脚本注入的 DOM 属性或 localStorage
    const currentAttr = document.documentElement.getAttribute("data-theme");
    if (currentAttr === "night") {
      setTheme("night");
      return;
    }

    const stored = localStorage.getItem("qasys-theme") as "day" | "night" | null;
    if (stored) {
      setTheme(stored);
      if (stored === "night") {
        document.documentElement.setAttribute("data-theme", "night");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setTheme("night");
        document.documentElement.setAttribute("data-theme", "night");
      }
    }
  }, []);

  const toggle = () => {
    const next = theme === "day" ? "night" : "day";
    setTheme(next);
    localStorage.setItem("qasys-theme", next);
    if (next === "night") {
      document.documentElement.setAttribute("data-theme", "night");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    window.dispatchEvent(new CustomEvent("qasys-theme-change", { detail: next }));
  };

  if (!mounted) {
    return (
      <div className={`h-8 w-8 ${className}`} aria-hidden="true" />
    );
  }

  const isNight = theme === "night";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isNight ? "切换为暖阳白昼" : "切换为烛光夜读"}
      aria-label={isNight ? "切换为暖阳白昼" : "切换为烛光夜读"}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-full border border-rule bg-paper-soft/80 text-ink-soft transition-all duration-300 hover:border-seal/60 hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal ${className}`}
    >
      {isNight ? (
        // 烛光小油灯图标
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-[#e09838] transition-transform duration-300 group-hover:scale-110"
        >
          {/* 灯芯火苗 */}
          <path
            d="M12 2c.8 1.4 1.5 2.5 1.5 4 0 1.2-.7 2-1.5 2s-1.5-.8-1.5-2c0-1.5.7-2.6 1.5-4z"
            fill="#f5c05c"
            stroke="none"
            className="animate-pulse"
          />
          {/* 灯座 */}
          <path d="M9 10h6v3H9z" />
          <path d="M7 13h10v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-2z" />
          <path d="M5 21h14" />
          <path d="M12 8v2" />
        </svg>
      ) : (
        // 暖阳柔光图标
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-ink-soft transition-transform duration-300 group-hover:rotate-45 group-hover:text-seal"
        >
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
      <span className="sr-only">
        {isNight ? "切换为暖阳白昼" : "切换为烛光夜读"}
      </span>
    </button>
  );
}
