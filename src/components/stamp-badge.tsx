import type { CSSProperties, ReactNode } from "react";

export type StampTheme =
  | "carp"
  | "goose"
  | "lantern"
  | "moon"
  | "boat"
  | "brush"
  | "plum"
  | "peak";
export type StampColor = "seal" | "ochre" | "pine" | "navy" | "ink";

const STAMP_THEMES: StampTheme[] = [
  "carp",
  "goose",
  "lantern",
  "moon",
  "boat",
  "brush",
  "plum",
  "peak",
];

const STAMP_COLORS: StampColor[] = ["seal", "ochre", "pine", "navy", "ink"];

const INK: Record<StampColor, string> = {
  seal: "text-seal",
  ochre: "text-ochre",
  pine: "text-pine",
  navy: "text-navy",
  ink: "text-ink-soft",
};

/**
 * 依据信件 id 确定性地推出它专属的那枚邮票：图案、印色、面值与贴歪的角度。
 * 同一封信在列表、详情、分享笺上永远是同一枚。
 */
export function stampOf(id: string) {
  const hash = Math.abs(
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
  return {
    hash,
    theme: STAMP_THEMES[hash % STAMP_THEMES.length],
    color: STAMP_COLORS[(hash >> 2) % STAMP_COLORS.length],
    price: String(50 + (hash % 50)),
    tilt: (hash % 7) - 3,
  };
}

/* 邮票上的小画：32 格见方的线描，取鱼雁传书、灯月舟山这些书信里的旧意象 */
const ART: Record<StampTheme, ReactNode> = {
  // 鲤：「呼儿烹鲤鱼，中有尺素书」
  carp: (
    <>
      <path d="M5 16c4-6 12-7 17-2.5l5-3.5c-.8 3-.8 6 0 9l-5-3.5C17 22 9 22 5 16z" />
      <path d="M13 12.6c1.2 2.2 1.2 4.8 0 7M17 14.5c1 .9 1 2.2 0 3.2M20 15c.7.7.7 1.6 0 2.4" />
      <circle cx="10" cy="15.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="8" r="1.1" />
      <circle cx="9.5" cy="5" r="0.7" />
      <path d="M4 27q2.5-1.6 5 0t5 0 5 0 5 0 4 0" />
    </>
  ),
  // 雁：鸿雁传书
  goose: (
    <>
      <circle cx="22.5" cy="9.5" r="4.2" />
      <path d="M4.5 11.5q2-2.6 3.6-.6 1.4-2.2 3.6.2M10 17.5q1.8-2.3 3.2-.5 1.3-2 3.2.2M4 21q1.5-2 2.7-.4 1.1-1.7 2.7.2" />
      <path d="M3 27.5c4-3.5 7-3.5 10-1s6 2 9-1.5 5-2.5 7 0" />
    </>
  ),
  lantern: (
    <>
      <path d="M16 2.5v3M12 5.5h8M12.5 21h7" />
      <path d="M12 5.5c-4.5 2.5-4.5 13 0 15.5h8c4.5-2.5 4.5-13 0-15.5" />
      <path d="M16 5.5V21M13.6 5.8c-1.6 4-1.6 11 0 15M18.4 5.8c1.6 4 1.6 11 0 15" />
      <path d="M16 21v3.5M14.5 24.5h3M14.8 24.5v4M17.2 24.5v4M16 24.5v5" />
    </>
  ),
  moon: (
    <>
      <path d="M21 5.5a9 9 0 1 0 5 12.4A7.4 7.4 0 0 1 21 5.5z" />
      <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="4" r="0.55" fill="currentColor" stroke="none" />
      <path d="M4 25.5q2.5-1.6 5 0t5 0 5 0 5 0 4 0M8 29q2.5-1.6 5 0t5 0 5 0" />
    </>
  ),
  boat: (
    <>
      <path d="M16 4.5V21M16 6c5 3 7 8 7.5 13H16M14.4 9c-3 3-4.5 6.5-5 10h5" />
      <path d="M6 21.5h20c-1 3-3.5 4.5-6 4.5h-8c-2.5 0-5-1.5-6-4.5z" />
      <path d="M3 29.5q2.5-1.6 5 0t5 0 5 0 5 0 5 0" />
    </>
  ),
  brush: (
    <>
      <path d="M25.5 4.5l2 2L14 20l-2-2zM12 18l2 2-1.6 1.6-2-2z" />
      <path
        d="M10.4 19.6c-2.6 1.4-4.2 4-4.9 7.9 3.9-.7 6.5-2.3 7.9-4.9z"
        fill="currentColor"
        fillOpacity="0.28"
      />
      <path d="M17.5 28.5h10" />
      <circle cx="22.5" cy="25" r="2.2" fill="currentColor" fillOpacity="0.28" />
    </>
  ),
  plum: (
    <>
      <path d="M4 28.5c5-3 8-7 10-12s5-8 11-10M14 16.5c-3-1-5-3-6-6" />
      <circle cx="22" cy="10" r="3" />
      <circle cx="8.5" cy="8.5" r="2.4" />
      <circle cx="16" cy="22" r="2.2" />
      <circle cx="22" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="26" cy="4.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="24.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  peak: (
    <>
      <circle cx="23" cy="8.5" r="3.4" />
      <path d="M3 25.5l8-13 4.5 6.5 3-4L29 25.5z" />
      <path d="M11 12.5l2.5 6.5M18.5 15l2 5M6 29h20" />
    </>
  ),
};

/**
 * 邮票。齿孔由 CSS 蒙版打出（见 globals.css 的 .stamp-paper），
 * 票面用单色线描，颜色跟着 currentColor 走。纯装饰，对读屏隐藏。
 */
export function PostageStamp({
  theme = "carp",
  color = "seal",
  price = "80",
  size = "md",
  tilt = 0,
  className = "",
}: {
  theme?: StampTheme;
  color?: StampColor;
  price?: string;
  size?: "sm" | "md" | "lg";
  tilt?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-size={size}
      className={`stamp ${INK[color]} ${className}`}
      style={{ rotate: `${tilt}deg` }}
    >
      <span className="stamp-paper">
        <span className="stamp-face">
          <span className="text-[calc(var(--stamp-w)*0.105)] tracking-[0.12em]">
            尺素邮政
          </span>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto w-[58%]"
          >
            {ART[theme]}
          </svg>
          <span className="flex items-baseline justify-end gap-px">
            <span className="text-[calc(var(--stamp-w)*0.2)] font-bold">
              {price}
            </span>
            <span className="text-[calc(var(--stamp-w)*0.105)]">分</span>
          </span>
        </span>
      </span>
    </span>
  );
}

/**
 * 邮戳：日戳一枚，旁带机盖的波浪销票线。
 * place 写在上弧，date 落在腰带，sub 压在下方。
 */
export function Postmark({
  place = "尺素",
  date = "",
  sub = "信箱",
  waves = true,
  className = "",
  style,
}: {
  place?: string;
  date?: string;
  sub?: string;
  waves?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={waves ? "0 0 126 64" : "0 0 64 64"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      className={`ink-stamp worn h-14 w-auto shrink-0 ${className}`}
      style={style}
    >
      <g transform="rotate(-9 32 32)">
        <circle cx="32" cy="32" r="29" />
        <path d="M5.6 26h52.8M5.6 38.5h52.8" strokeWidth="1" />
        <g fill="currentColor" stroke="none" textAnchor="middle">
          <text
            x="32"
            y="21"
            fontSize="10.5"
            letterSpacing="2"
            className="font-kai"
          >
            {place}
          </text>
          <text
            x="32"
            y="35.4"
            fontSize="7.4"
            letterSpacing="0.3"
            className="font-song"
          >
            {date}
          </text>
          <text
            x="32"
            y="50"
            fontSize="7.6"
            letterSpacing="1.6"
            className="font-song"
          >
            {sub}
          </text>
        </g>
      </g>
      {waves && (
        <path
          d="M66 17q5-4 10 0t10 0 10 0 10 0 10 0 8 0M66 27q5-4 10 0t10 0 10 0 10 0 10 0 8 0M66 37q5-4 10 0t10 0 10 0 10 0 10 0 8 0M66 47q5-4 10 0t10 0 10 0 10 0 10 0 8 0"
          strokeWidth="1.1"
        />
      )}
    </svg>
  );
}

/**
 * 一枚邮票连同销票的邮戳：戳压在票的左下角，像真寄过。
 */
export function Postage({
  id,
  date,
  size = "md",
  className = "",
}: {
  id: string;
  /** 形如 2026.11.15 */
  date: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const stamp = stampOf(id);
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-start ${className}`}
    >
      <Postmark
        date={date}
        className={`relative z-10 -mr-5 mt-[38%] hidden sm:block ${
          size === "sm" ? "h-11" : "h-14"
        }`}
      />
      <PostageStamp
        theme={stamp.theme}
        color={stamp.color}
        price={stamp.price}
        tilt={stamp.tilt}
        size={size}
      />
    </span>
  );
}

/**
 * 印章。白文（yin）朱底留白，朱文（yang）只留朱线；
 * 一字居中，二字竖排，四字右起两列。
 */
export function Seal({
  text = "尺素",
  variant = "yin",
  shape = "square",
  size,
  tilt = 0,
  worn = true,
  className = "",
  label,
}: {
  text?: string;
  variant?: "yin" | "yang";
  shape?: "square" | "round";
  /** 边长，任意 CSS 长度；缺省 2.75rem */
  size?: string;
  tilt?: number;
  worn?: boolean;
  className?: string;
  /** 给了就当图读出来，不给则视为装饰 */
  label?: string;
}) {
  const glyphs = [...text].slice(0, 4);
  const style = {
    ...(size ? { "--seal-size": size } : null),
    rotate: `${tilt}deg`,
  } as CSSProperties;

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-variant={variant}
      data-shape={shape}
      className={`seal-mark ${worn ? "worn" : ""} ${className}`}
      style={style}
    >
      <span className="seal-glyphs" data-count={glyphs.length}>
        {glyphs.map((glyph, i) => (
          <span key={i}>{glyph}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * 退件章之类的长方戳记：双线框，字横排。
 */
export function BoxMark({
  children,
  tilt = -6,
  className = "",
}: {
  children: ReactNode;
  tilt?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`ink-stamp worn inline-block border-2 border-current p-[3px] ${className}`}
      style={{ rotate: `${tilt}deg` }}
    >
      <span className="block border border-current px-3 py-1.5 font-song text-small font-bold tracking-[0.3em]">
        {children}
      </span>
    </span>
  );
}
