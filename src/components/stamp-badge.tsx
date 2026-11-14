import React from "react";

export type StampTheme = "lantern" | "moon" | "quill" | "boat" | "letter" | "sprout";
export type StampColor = "seal" | "amber" | "forest" | "indigo" | "ink";

interface PostageStampProps {
  theme?: StampTheme;
  title?: string;
  year?: string;
  price?: string;
  className?: string;
  color?: StampColor;
  size?: "sm" | "md" | "lg";
}

export function PostageStamp({
  theme = "letter",
  title = "拾光",
  year = "2026",
  price = "80",
  className = "",
  color = "seal",
  size = "md",
}: PostageStampProps) {
  const colorMap: Record<StampColor, string> = {
    seal: "text-seal border-seal/35 bg-seal/[0.04]",
    amber: "text-[#b46d1b] border-[#b46d1b]/35 bg-[#b46d1b]/[0.04]",
    forest: "text-[#3f5f4b] border-[#3f5f4b]/35 bg-[#3f5f4b]/[0.04]",
    indigo: "text-[#3c5279] border-[#3c5279]/35 bg-[#3c5279]/[0.04]",
    ink: "text-ink border-ink/35 bg-ink/[0.03]",
  };

  const currentTheme = colorMap[color] || colorMap.seal;

  const sizeDimensions = {
    sm: "w-[56px] h-[70px] p-1.5",
    md: "w-[72px] h-[90px] p-2",
    lg: "w-[88px] h-[110px] p-2.5",
  };

  return (
    <div
      className={`group/stamp relative inline-flex flex-col items-center justify-between select-none transition-transform duration-300 hover:scale-105 hover:-rotate-1 ${sizeDimensions[size]} ${currentTheme} ${className}`}
      style={{
        boxShadow: "0 2px 8px -2px rgba(28, 25, 23, 0.12)",
      }}
    >
      {/* 齿孔效果 (Perforated edges) */}
      <div
        className="pointer-events-none absolute -inset-[3px] border-[3px] border-dashed border-current opacity-35"
        style={{ borderRadius: "2px" }}
      />

      {/* 内边框 */}
      <div className="absolute inset-1 border border-current opacity-40" />

      {/* 邮票顶部信息 */}
      <div className="relative z-10 flex w-full items-center justify-between px-0.5 font-mono text-[7.5px] tracking-wider opacity-85">
        <span>{title}</span>
        <span>{price}分</span>
      </div>

      {/* 邮票中心微型插画 */}
      <div className="relative z-10 flex flex-1 items-center justify-center py-0.5">
        {theme === "lantern" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 2v2M8 4h8l2 5-2 9H8L6 9l2-5zM9 18v2h6v-2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11.5" r="2.5" fill="currentColor" opacity="0.3" />
            <path d="M12 20v2" strokeLinecap="round" />
          </svg>
        )}
        {theme === "moon" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9 9 0 0 0 12 3z" />
            <circle cx="17.5" cy="5.5" r="0.75" fill="currentColor" />
            <circle cx="19" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
        )}
        {theme === "quill" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="m18 2-6 7.5L5 18l-3 4 4-3 8.5-7L22 6l-4-4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m8 15 3 3M14 9l3 3" strokeLinecap="round" />
          </svg>
        )}
        {theme === "boat" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M2 18h20l-3 4H5l-3-4zM12 3v13M12 5l7 8h-7M12 7l-5 6h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {theme === "sprout" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M12 21V10M12 10a5 5 0 0 1 7-4 5 5 0 0 1-3 7h-4zM12 14a4 4 0 0 0-6-3 4 4 0 0 0 2 6h4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {theme === "letter" && (
          <svg className={size === "sm" ? "h-5 w-5 opacity-85" : "h-7 w-7 opacity-85"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect width="18" height="13" x="3" y="5" rx="1.5" />
            <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* 邮票底部年份 */}
      <div className="relative z-10 flex w-full items-center justify-center font-mono text-[7px] tracking-widest opacity-80">
        <span>{year} · POST</span>
      </div>
    </div>
  );
}

export function CancellationMark({
  date = "2026.11",
  location = "拾光",
  className = "",
}: {
  date?: string;
  location?: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none relative inline-flex items-center gap-1 text-seal/45 select-none ${className}`}
      aria-hidden="true"
    >
      {/* 邮戳圆环 */}
      <div className="relative flex h-13 w-13 items-center justify-center rounded-full border border-current">
        <div className="absolute inset-[3px] rounded-full border border-dashed border-current opacity-60" />
        <div className="flex flex-col items-center justify-center text-center font-hei text-[7.5px] leading-tight">
          <span className="font-kai text-[9.5px] font-medium tracking-widest">{location}</span>
          <span className="font-mono text-[7px] tracking-tight">{date}</span>
          <span className="text-[6px] tracking-tighter opacity-80">AIR MAIL</span>
        </div>
      </div>

      {/* 邮戳波浪线 */}
      <svg className="h-7 w-12 stroke-current opacity-70" viewBox="0 0 60 20" fill="none">
        <path d="M0 4 Q 8 0, 15 4 T 30 4 T 45 4 T 60 4" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M0 10 Q 8 6, 15 10 T 30 10 T 45 10 T 60 10" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M0 16 Q 8 12, 15 16 T 30 16 T 45 16 T 60 16" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function WaxSeal({
  character = "信",
  size = "md",
  className = "",
  onClick,
}: {
  character?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[12px]",
    md: "w-11 h-11 text-[16px]",
    lg: "w-16 h-16 text-[22px]",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative inline-flex items-center justify-center rounded-full transition-transform duration-300 ${
        onClick ? "cursor-pointer hover:scale-108 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/50" : ""
      } ${sizeClasses[size]} ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #d64d3c, #9d2b1f 65%, #6e1c13 100%)",
        boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 3px 10px -2px rgba(110, 28, 19, 0.55), 0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {/* 蜡封外圈的不规则印痕 */}
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-full border border-[#fbf7ee]/25 opacity-70"
        style={{
          boxShadow: "inset 0 0 4px rgba(0, 0, 0, 0.3)",
        }}
      />
      {/* 内圈凹陷印章 */}
      <div className="relative flex h-[74%] w-[74%] items-center justify-center rounded-full border border-[#fbf7ee]/45 shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]">
        <span className="font-kai font-semibold leading-none text-[#fbf7ee] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
          {character}
        </span>
      </div>
    </div>
  );
}
