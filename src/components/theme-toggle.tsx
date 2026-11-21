"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMotion,
  currentTone,
  MOTION_KEY,
  readMotion,
  readThemeMode,
  resolveTone,
  saveMotion,
  saveThemeMode,
  THEME_MODE_KEY,
  THEME_MODES,
  transitionTone,
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
  const fieldsetRef = useRef<HTMLFieldSetElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const labelRefs = useRef<Partial<Record<ThemeMode, HTMLLabelElement | null>>>(
    {},
  );
  const readyRef = useRef(false);

  useEffect(() => {
    setMode(readThemeMode());
    setTone(currentTone());
  }, []);

  // 底部朱红横线随选中项平滑滑动并跟随「依时」宽度动态伸缩
  useEffect(() => {
    if (!mode) return;
    const indicator = indicatorRef.current;
    const fieldset = fieldsetRef.current;
    const active = labelRefs.current[mode];
    if (!indicator || !fieldset || !active) return;

    const sync = () => {
      const target = labelRefs.current[mode];
      if (!target) return;
      const x = target.offsetLeft + 10;
      const w = Math.max(0, target.offsetWidth - 20);
      indicator.style.transform = `translate3d(${x}px, 0, 0)`;
      indicator.style.width = `${w}px`;
    };

    sync();

    let raf = 0;
    if (!readyRef.current) {
      raf = requestAnimationFrame(() => {
        readyRef.current = true;
        indicator.setAttribute("data-ready", "true");
      });
    }

    const ro = new ResizeObserver(sync);
    ro.observe(fieldset);
    ro.observe(active);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode]);

  // 依时档：交给定时器守着，跨过点灯/熄灯的时刻就换
  useEffect(() => {
    if (mode !== "clock") return;

    const sync = () => {
      const next = resolveTone("clock");
      if (next === currentTone()) return;
      transitionTone(next);
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
      transitionTone(nextTone);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const choose = useCallback((next: ThemeMode) => {
    setMode(next);
    saveThemeMode(next);
    const nextTone = resolveTone(next);
    setTone(nextTone);
    transitionTone(nextTone);
  }, []);

  return (
    <fieldset
      ref={fieldsetRef}
      className={`seg font-song ${mode ? "" : "invisible"} ${className}`}
    >
      <legend className="sr-only">明暗</legend>
      {THEME_MODES.map((item) => (
        <label
          key={item}
          ref={(el) => {
            labelRefs.current[item] = el;
          }}
        >
          <input
            type="radio"
            name="theme-mode"
            value={item}
            checked={mode === item}
            onChange={() => choose(item)}
          />
          {LABEL[item]}
          {item === "clock" && (
            <span
              className="seg-clock-tag"
              data-open={mode === "clock" ? "true" : "false"}
              aria-hidden={mode !== "clock"}
            >
              <span className="pl-1 font-kai tracking-normal text-ink-faint">
                · {tone === "night" ? "夜" : "昼"}
              </span>
            </span>
          )}
        </label>
      ))}
      <span ref={indicatorRef} className="seg-indicator" aria-hidden="true" />
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
      aria-label={still ? "动风" : "止风"}
      title={still ? "纸页已静，点此动风" : "令飞笺暂歇"}
      className={`btn btn-line btn-sm ${motion ? "" : "invisible"} ${
        still ? "border-seal/50 text-seal" : ""
      } ${className}`}
    >
      <span aria-hidden="true" className="inline-flex items-center">
        <span
          className="roll-slot"
          data-rolled={still ? "true" : "false"}
        >
          <span className="roll-track">
            <span className="roll-item">止</span>
            <span className="roll-item">动</span>
          </span>
        </span>
        <span className="roll-item">风</span>
      </span>
    </button>
  );
}
