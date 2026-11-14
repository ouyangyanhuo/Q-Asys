"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyTone,
  currentTone,
  readThemeMode,
  resolveTone,
  saveThemeMode,
  THEME_MODE_KEY,
  type ThemeMode,
  type ThemeTone,
} from "@/lib/theme";

interface Option {
  mode: ThemeMode;
  label: string;
  hint?: string;
}

const OPTIONS: Option[] = [
  { mode: "day", label: "白昼" },
  { mode: "night", label: "夜读" },
  { mode: "clock", label: "依时", hint: "18–07" },
  { mode: "system", label: "随系统", hint: "从设备" },
];

const MODE_LABEL: Record<ThemeMode, string> = {
  day: "白昼",
  night: "夜读",
  clock: "依时",
  system: "随系统",
};

export function ThemeToggle({
  className = "",
  placement = "bottom",
}: {
  className?: string;
  placement?: "top" | "bottom";
}) {
  const [mode, setMode] = useState<ThemeMode | null>(null);
  const [tone, setTone] = useState<ThemeTone>("day");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 首次挂载：认领 head 脚本已经定下的明暗
  useEffect(() => {
    const initial = readThemeMode();
    setMode(initial);
    setTone(currentTone());
  }, []);

  // 依时与随系统：交给定时器与系统事件守着
  useEffect(() => {
    if (!mode) return;

    const sync = () => {
      const next = resolveTone(mode);
      if (next === currentTone()) return;
      applyTone(next);
      setTone(next);
    };

    if (mode !== "clock" && mode !== "system") return;

    const timer = window.setInterval(sync, 30_000);
    const onVisible = () => {
      if (!document.hidden) sync();
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if (mode === "system") sync();
    };

    document.addEventListener("visibilitychange", onVisible);
    media.addEventListener("change", onScheme);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      media.removeEventListener("change", onScheme);
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

  // 点击别处或按 Esc 收起
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = useCallback((next: ThemeMode) => {
    setOpen(false);
    setMode(next);
    saveThemeMode(next);
    const nextTone = resolveTone(next);
    setTone(nextTone);
    applyTone(nextTone);
  }, []);

  if (!mode) {
    return <div className={`h-8 w-8 ${className}`} aria-hidden="true" />;
  }

  const isNight = tone === "night";
  const isAuto = mode === "clock" || mode === "system";
  const action = `明暗 · ${MODE_LABEL[mode]}`;

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={action}
        aria-label={action}
        className="group relative flex h-8 w-8 items-center justify-center rounded-full border border-rule bg-paper-soft/80 text-ink-soft transition-all duration-300 hover:border-seal/60 hover:text-seal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
      >
        {isNight ? (
          // 烛光小油灯
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-[#e09838] transition-transform duration-300 group-hover:scale-110"
          >
            <path
              d="M12 2c.8 1.4 1.5 2.5 1.5 4 0 1.2-.7 2-1.5 2s-1.5-.8-1.5-2c0-1.5.7-2.6 1.5-4z"
              fill="#f5c05c"
              stroke="none"
              className="animate-pulse"
            />
            <path d="M9 10h6v3H9z" />
            <path d="M7 13h10v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-2z" />
            <path d="M5 21h14" />
            <path d="M12 8v2" />
          </svg>
        ) : (
          // 暖阳
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

        {/* 自动时留一点朱砂，说明此刻不由人手 */}
        {isAuto && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-seal ring-2 ring-paper-soft" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="明暗"
          className={`absolute right-0 z-50 w-[178px] border border-rule bg-paper-soft p-1.5 shadow-[0_18px_40px_-20px_rgba(28,25,23,0.45)] ${
            placement === "top" ? "bottom-full mb-2.5" : "top-full mt-2.5"
          }`}
        >
          <p className="px-2 pb-1.5 pt-1 font-hei text-[9px] tracking-[0.32em] text-ink-faint/70">
            明暗
          </p>

          <div className="flex flex-col">
            {OPTIONS.map((option) => {
              const active = option.mode === mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(option.mode)}
                  className={`group flex items-center justify-between gap-3 px-2 py-[7px] text-left transition-colors ${
                    active
                      ? "bg-seal/[0.06] text-seal"
                      : "text-ink-soft hover:bg-paper-deep/30 hover:text-ink"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1 w-1 rounded-full transition-colors ${
                        active ? "bg-seal" : "bg-transparent"
                      }`}
                    />
                    <span className="font-song text-[12.5px] tracking-[0.12em]">
                      {option.label}
                    </span>
                  </span>
                  {option.hint && (
                    <span
                      className={`font-mono text-[9px] tracking-[0.06em] ${
                        active ? "text-seal/70" : "text-ink-faint/60"
                      }`}
                    >
                      {option.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-1 border-t border-rule/60 px-2 pb-0.5 pt-1.5 font-kai text-[10px] leading-relaxed text-ink-faint/70">
            入夜自暗，天明自明。
          </p>
        </div>
      )}
    </div>
  );
}
