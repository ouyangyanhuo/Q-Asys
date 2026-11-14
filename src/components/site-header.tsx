import Link from "next/link";
import { formatToday } from "@/lib/format";

export function SealMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-9 w-9 shrink-0 rotate-[-4deg] items-center justify-center border border-seal font-kai text-[15px] leading-none text-seal ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inset-[3px] border border-seal/40" />
      <span className="relative -translate-y-[0.5px]">信</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-rule/80">
      <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="group flex items-center gap-3">
          <SealMark className="transition-transform duration-500 group-hover:rotate-0" />
          <span className="flex flex-col">
            <span className="font-song text-[15px] tracking-[0.24em] text-ink">
              拾光信箱
            </span>
            <span className="mt-1 font-hei text-[10px] tracking-[0.28em] text-ink-faint">
              LETTERS, UNSIGNED
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 font-hei text-[12px] text-ink-soft md:flex">
          <a href="/#write" className="transition-colors hover:text-seal">
            写信
          </a>
          <a href="/#letters" className="transition-colors hover:text-seal">
            读信
          </a>
          <Link href="/admin" className="transition-colors hover:text-seal">
            收信人
          </Link>
        </nav>

        <p className="hidden font-hei text-[11px] tracking-[0.08em] text-ink-faint sm:block">
          {formatToday()}
        </p>
      </div>
    </header>
  );
}
