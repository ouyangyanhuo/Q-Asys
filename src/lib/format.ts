const TZ = "Asia/Shanghai";
const DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function cn(n: number): string {
  if (n < 10) return DIGITS[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + DIGITS[n % 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return DIGITS[tens] + "十" + (ones ? DIGITS[ones] : "");
}

function parts(iso: string | Date) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hh: map.hour,
    mm: map.minute,
  };
}

export function yearCn(year: number): string {
  return String(year)
    .split("")
    .map((c) => DIGITS[Number(c)])
    .join("");
}

export function formatDay(iso: string): string {
  const { m, d } = parts(iso);
  return `${cn(m)}月${cn(d)}日`;
}

export function formatFullDate(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${yearCn(y)}年${cn(m)}月${cn(d)}日`;
}

export function formatStamp(iso: string): string {
  const { y, m, d, hh, mm } = parts(iso);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} ${hh}:${mm}`;
}

export function formatMonth(): string {
  const now = new Date();
  const { y, m } = parts(now);
  return `${yearCn(y)}年${cn(m)}月`;
}

/** 整数写成汉字：42 → 四十二，105 → 一百〇五，1234 → 一千二百三十四 */
export function toCn(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  n = Math.floor(n);
  if (n < 100) return cn(n);
  if (n >= 100_000) return String(n);

  const units = ["", "十", "百", "千", "万"];
  const digits = String(n).split("").map(Number);
  let out = "";
  let pendingZero = false;
  digits.forEach((d, i) => {
    const unit = units[digits.length - 1 - i];
    if (d === 0) {
      pendingZero = out !== "";
      return;
    }
    if (pendingZero) out += "〇";
    pendingZero = false;
    out += DIGITS[d] + unit;
  });
  return out;
}

/** 函号：第四十二函 */
export function letterNo(n: number): string {
  return `第${toCn(n)}函`;
}

/** 邮戳上的日期：2026.11.15 */
export function formatDot(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

function lunarDay(d: number): string {
  if (d <= 10) return `初${cn(d)}`;
  if (d < 20) return cn(d);
  if (d === 20) return "二十";
  if (d < 30) return `廿${DIGITS[d % 10]}`;
  return "三十";
}

/**
 * 今日的干支与农历：丙午年十月初八。旧时书信皆如此落日期。
 * 运行环境不认农历时退回公历年月。
 */
export function formatLunar(date: Date = new Date()): string {
  try {
    const map = Object.fromEntries(
      new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
        timeZone: TZ,
        year: "numeric",
        month: "long",
        day: "numeric",
      })
        .formatToParts(date)
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const day = Number(map.day);
    if (map.yearName && map.month && day >= 1 && day <= 30) {
      return `${map.yearName}年${map.month}${lunarDay(day)}`;
    }
  } catch {
    // 落到下面的公历
  }
  return formatMonth();
}

/** 一年里的第几天，用来挑「今日一签」 */
export function dayOfYear(date: Date = new Date()): number {
  const { y, m, d } = parts(date);
  return Math.floor(
    (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000,
  );
}
