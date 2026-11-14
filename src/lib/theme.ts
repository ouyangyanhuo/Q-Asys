/**
 * 明暗的四种取法：白昼 / 夜读 / 依时 / 随系统。
 * 前两者是手动档，后两者交由时间或系统裁决。
 */

export type ThemeMode = "day" | "night" | "clock" | "system";
export type ThemeTone = "day" | "night";

export const THEME_MODE_KEY = "qasys-theme-mode";
/** 旧版只存了 day / night，读一次做兼容 */
export const LEGACY_THEME_KEY = "qasys-theme";

/** 点灯与收灯：戌初掌灯，卯末熄灯 */
export const NIGHT_START_HOUR = 18;
export const NIGHT_END_HOUR = 7;

export const THEME_MODES: ThemeMode[] = ["day", "night", "clock", "system"];

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    value === "day" ||
    value === "night" ||
    value === "clock" ||
    value === "system"
  );
}

/** 按时辰定明暗：18:00 起为夜，07:00 起为昼 */
export function toneByClock(date: Date = new Date()): ThemeTone {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR ? "night" : "day";
}

/** 按系统偏好定明暗 */
export function toneBySystem(): ThemeTone {
  if (typeof window === "undefined") return "day";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "day";
}

export function resolveTone(mode: ThemeMode): ThemeTone {
  switch (mode) {
    case "day":
      return "day";
    case "night":
      return "night";
    case "system":
      return toneBySystem();
    case "clock":
    default:
      return toneByClock();
  }
}

/** 读取用户选择；没选过就交给时辰（这也是首页的默认手感） */
export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "clock";
  try {
    const saved = window.localStorage.getItem(THEME_MODE_KEY);
    if (isThemeMode(saved)) return saved;

    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === "day" || legacy === "night") return legacy;
  } catch {
    // 隐私模式下 localStorage 可能不可用，退回默认
  }
  return "clock";
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_MODE_KEY, mode);
    window.localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    // 存不住就只作用于本次访问
  }
}

/** 把明暗落到 DOM 上：夜间靠 data-theme="night"，白昼则移除 */
export function applyTone(tone: ThemeTone): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (tone === "night") root.setAttribute("data-theme", "night");
  else root.removeAttribute("data-theme");

  // 让原生控件（滚动条、输入框光标）跟着换色
  root.style.colorScheme = tone === "night" ? "dark" : "light";

  window.dispatchEvent(
    new CustomEvent<ThemeTone>("qasys-theme-change", { detail: tone }),
  );
}

/** 当前页面上的明暗，供定时器比对是否需要切换 */
export function currentTone(): ThemeTone {
  if (typeof document === "undefined") return "day";
  return document.documentElement.getAttribute("data-theme") === "night"
    ? "night"
    : "day";
}
