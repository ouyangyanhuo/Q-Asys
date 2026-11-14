"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatToday } from "@/lib/format";
import { ThemeToggle } from "./theme-toggle";

export function SealMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-9 w-9 shrink-0 -rotate-3 items-center justify-center border border-seal font-kai text-[15px] leading-none text-seal transition-transform duration-500 hover:rotate-0 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-[3px] border border-seal/40" />
      <span className="relative -translate-y-[0.5px]">信</span>
    </span>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-rule/90 bg-paper/90 shadow-[0_4px_20px_-10px_rgba(28,25,23,0.08)] backdrop-blur-md"
          : "border-b border-rule/60 bg-paper/70 backdrop-blur-xs"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname === "/") {
              e.preventDefault();
              if (window.scrollY > 0 || window.location.hash) {
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (window.location.hash) {
                  history.pushState(null, "", "/");
                }
              }
            }
          }}
          className="group flex items-center gap-3"
        >
          <SealMark className="transition-transform duration-500 group-hover:rotate-0 group-hover:scale-108" />
          <span className="flex flex-col">
            <span className="font-song text-[16px] tracking-[0.24em] text-ink transition-colors group-hover:text-seal">
              拾光信箱
            </span>
            <span className="mt-0.5 font-hei text-[9.5px] tracking-[0.28em] text-ink-faint">
              LETTERS, UNSIGNED
            </span>
          </span>
        </Link>

        {/* 导航菜单 */}
        <nav className="flex items-center gap-6 font-hei text-[12px] tracking-wider text-ink-soft md:gap-9">
          <a href="/#write" className="transition-colors hover:text-seal">
            写信
          </a>
          <a href="/#letters" className="transition-colors hover:text-seal">
            读信
          </a>
          <Link href="/admin" className="transition-colors hover:text-seal">
            收信人
          </Link>

          <span className="hidden h-3 w-px bg-rule md:block" />

          {/* 昼夜/烛光模式切换 */}
          <ThemeToggle />

          <p className="hidden font-hei text-[10.5px] tracking-[0.1em] text-ink-faint lg:block">
            {formatToday()}
          </p>
        </nav>
      </div>
    </header>
  );
}
