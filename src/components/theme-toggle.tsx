"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyTone,
  currentTone,
  readThemeMode,
  resolveTone,
  saveThemeMode,
  THEME_MODE_KEY,
  THEME_MODES,
  type ThemeMode,
  type ThemeTone,
} from "@/lib/theme";

const LABEL: Record<ThemeMode, string> = {
  day: "日间",
  clock: "依时",
  night: "夜间",
};

const HINT: Record<ThemeMode, string> = {
  day: "恒以暖阳",
  clock: "入夜自暗，天明自明",
  night: "恒以烛火",
};

/**
 * 明暗三档的横向切换：日间 · 依时 · 夜间。
 * 中间那块把裁决权交给时辰，滑块跟着手走。
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode | null>(null);
  const [tone, setTone] = useState<ThemeTone>("day");

  useEffect(() => {
    setMode(readThemeMode());
    setTone(currentTone());
  }, []);

  // 依时档：交给定时器守着，跨过点灯/熄灯的时刻就换
  useEffect(() => {
    if (mode !== "clock") return;

    const sync = () => {
      const next = resolveTone("clock");
      if (next === currentTone()) return;
      applyTone(next);
      setTone(next);
    };

    const timer = window.setInterval(sync, 30_000);
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode]);

  // 别的标签页改了，这边跟上
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_MODE_KEY) return;
      const next = readThemeMode();
      const nextTone = resolveTone(next);
      setMode(next);
      setTone(nextTone);
      applyTone(nextTone);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const choose = useCallback((next: ThemeMode) => {
    setMode(next);
    saveThemeMode(next);
    const nextTone = resolveTone(next);
    setTone(nextTone);
    applyTone(nextTone);
  }, []);

  if (!mode) {
    return <div className={`h-8 w-[174px] ${className}`} aria-hidden="true" />;
  }

  const index = THEME_MODES.indexOf(mode);
  const isClock = mode === "clock";
  const hint = isClock
    ? tone === "night"
      ? "此刻依时：夜"
      : "此刻依时：昼"
    : HINT[mode];

  return (
    <div
      role="radiogroup"
      aria-label="明暗"
      title={hint}
      className={`relative inline-flex h-8 w-[174px] items-stretch rounded-full border border-rule bg-paper p-[3px] ${className}`}
    >
      {/* 滑块：三档等分，位置即状态 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[3px] left-[3px] top-[3px] w-[calc((100%-6px)/3)] rounded-full bg-paper-deep shadow-[0_1px_2px_rgba(28,25,23,0.1),inset_0_1px_0_rgba(255,255,255,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,0.68,0.25,1)]"
        style={{ transform: `translateX(${index * 100}%)` }}
      />

      {THEME_MODES.map((item) => {
        const active = item === mode;
        return (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(item)}
            className={`relative z-10 flex-1 rounded-full font-hei text-[11.5px] tracking-[0.14em] transition-colors duration-300 ${
              active ? "text-ink" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {LABEL[item]}
          </button>
        );
      })}
    </div>
  );
}
