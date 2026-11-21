/**
 * 明暗的三档：日间 / 依时 / 夜间。
 * 「依时」把裁决权交给时辰，其余两档由人手动定。
 */

export type ThemeMode = "day" | "night" | "clock";
export type ThemeTone = "day" | "night";

export const THEME_MODE_KEY = "qasys-theme-mode";
/** 旧版只存了 day / night，读一次做兼容 */
export const LEGACY_THEME_KEY = "qasys-theme";

/** 点灯与收灯：戌初掌灯，卯末熄灯 */
export const NIGHT_START_HOUR = 18;
export const NIGHT_END_HOUR = 7;

export const THEME_MODES: ThemeMode[] = ["day", "clock", "night"];

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "day" || value === "night" || value === "clock";
}

/** 按时辰定明暗：18:00 起为夜，07:00 起为昼 */
export function toneByClock(date: Date = new Date()): ThemeTone {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR ? "night" : "day";
}

export function resolveTone(mode: ThemeMode): ThemeTone {
  switch (mode) {
    case "day":
      return "day";
    case "night":
      return "night";
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
    // 旧版「随系统」已下线，归入依时
    if (saved === "system") return "clock";

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

/**
 * 把明暗落到 DOM 上：夜间靠 data-theme="night"，白昼则移除。
 * 原生控件（滚动条、输入框光标）的配色由样式表里的 color-scheme 跟着这个属性走。
 */
export function applyTone(tone: ThemeTone): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (tone === "night") root.setAttribute("data-theme", "night");
  else root.removeAttribute("data-theme");

  window.dispatchEvent(
    new CustomEvent<ThemeTone>("qasys-theme-change", { detail: tone }),
  );
}

/**
 * 无闪烁切色：
 * 1. 先以 data-theme-switching 临时压住各元素参差不齐的 transition，避免底色、卡片、文字各走各的时长造成频闪；
 * 2. 若浏览器支持 View Transitions API，用整页 GPU 交叉淡化，让宣纸、卡片、远山与 WebGL 同步溶入新色调。
 */
export function transitionTone(tone: ThemeTone): void {
  if (typeof document === "undefined") return;
  if (tone === currentTone()) return;

  const root = document.documentElement;
  const commit = () => {
    root.setAttribute("data-theme-switching", "");
    applyTone(tone);
    // 强制同步刷新样式，确保新色在同一帧内全部落定
    void root.offsetWidth;
    requestAnimationFrame(() => {
      root.removeAttribute("data-theme-switching");
    });
  };

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof doc.startViewTransition === "function" && !reduce) {
    doc.startViewTransition(() => {
      root.setAttribute("data-theme-switching", "");
      applyTone(tone);
      void root.offsetWidth;
      root.removeAttribute("data-theme-switching");
    });
  } else {
    commit();
  }
}

/** 当前页面上的明暗，供定时器比对是否需要切换 */
export function currentTone(): ThemeTone {
  if (typeof document === "undefined") return "day";
  return document.documentElement.getAttribute("data-theme") === "night"
    ? "night"
    : "day";
}

/**
 * 背景动效的起与止。「still」时纸场停在一帧，光晕不再游走；
 * 入场、钤印这类一次性的动作不受影响。
 */
export type Motion = "flow" | "still";

export const MOTION_KEY = "qasys-motion";

export function readMotion(): Motion {
  if (typeof window === "undefined") return "flow";
  try {
    return window.localStorage.getItem(MOTION_KEY) === "still"
      ? "still"
      : "flow";
  } catch {
    return "flow";
  }
}

export function saveMotion(motion: Motion): void {
  try {
    if (motion === "still") window.localStorage.setItem(MOTION_KEY, "still");
    else window.localStorage.removeItem(MOTION_KEY);
  } catch {
    // 存不住就只作用于本次访问
  }
}

export function applyMotion(motion: Motion): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (motion === "still") root.setAttribute("data-motion", "still");
  else root.removeAttribute("data-motion");

  window.dispatchEvent(
    new CustomEvent<Motion>("qasys-motion-change", { detail: motion }),
  );
}
