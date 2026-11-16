"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyMotion,
  applyTone,
  currentTone,
  MOTION_KEY,
  readMotion,
  readThemeMode,
  resolveTone,
  saveMotion,
  saveThemeMode,
  THEME_MODE_KEY,
  THEME_MODES,
  type Motion,
  type ThemeMode,
  type ThemeTone,
} from "@/lib/theme";

const LABEL: Record<ThemeMode, string> = {
  day: "日间",
  clock: "依时",
  night: "夜间",
};

/**
 * 明暗三档：日间 · 依时 · 夜间。
 * 用原生单选钮，方向键切换、读屏播报都是现成的；
 * 「依时」把裁决权交给时辰，并把此刻是昼是夜写在旁边。
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

  return (
    <fieldset
      className={`seg font-song ${mode ? "" : "invisible"} ${className}`}
    >
      <legend className="sr-only">明暗</legend>
      {THEME_MODES.map((item) => (
        <label key={item}>
          <input
            type="radio"
            name="theme-mode"
            value={item}
            checked={mode === item}
            onChange={() => choose(item)}
          />
          {LABEL[item]}
          {item === "clock" && mode === "clock" && (
            <span className="ml-1 font-kai tracking-normal text-ink-faint">
              · {tone === "night" ? "夜" : "昼"}
            </span>
          )}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * 止风：把常驻的背景动效（飘着的纸、游走的光）停住。
 * 自己会动、又一直不停的东西，得给人一个叫停的地方。
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const [motion, setMotion] = useState<Motion | null>(null);

  useEffect(() => {
    setMotion(readMotion());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== MOTION_KEY) return;
      const next = readMotion();
      setMotion(next);
      applyMotion(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = () => {
    const next: Motion = motion === "still" ? "flow" : "still";
    setMotion(next);
    saveMotion(next);
    applyMotion(next);
  };

  const still = motion === "still";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={still}
      title={still ? "纸页已静，点此起风" : "令飞笺暂歇"}
      className={`btn btn-line btn-sm ${motion ? "" : "invisible"} ${
        still ? "border-seal/50 text-seal" : ""
      } ${className}`}
    >
      <span aria-hidden="true" className="font-kai tracking-normal">
        {still ? "静" : "风"}
      </span>
      止风
    </button>
  );
}
