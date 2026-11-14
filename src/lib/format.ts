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

export function formatToday(): string {
  const now = new Date();
  const { y, m, d } = parts(now);
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    timeZone: TZ,
    weekday: "long",
  }).format(now);
  return `${yearCn(y)}年${cn(m)}月${cn(d)}日 · ${weekday}`;
}

export function formatMonth(): string {
  const now = new Date();
  const { y, m } = parts(now);
  return `${yearCn(y)}年${cn(m)}月`;
}
