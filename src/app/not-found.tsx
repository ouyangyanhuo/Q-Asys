import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CancellationMark, WaxSeal } from "@/components/stamp-badge";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-[580px] flex-col items-start px-6 py-28 md:py-36">
        <div className="flex items-center gap-3">
          <WaxSeal character="空" size="sm" />
          <span className="font-mono text-[12px] tracking-[0.25em] text-ink-faint">
            404 · LETTER MISSING
          </span>
        </div>

        <h1 className="mt-7 font-song text-[34px] leading-[1.3] text-ink">
          这封信不在信箱里。
        </h1>

        <p className="mt-5 font-kai text-[16px] leading-[2.1] text-ink-soft">
          可能还没被收信人公开，也可能被悄悄收进了深处的抽屉。
          <br />
          世间很多声音原本就只属于一个人。
        </p>

        <div className="my-8">
          <CancellationMark date="2026.11" location="未达" />
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Link
            href="/"
            className="bg-seal px-6 py-2.5 font-hei text-[12px] tracking-[0.2em] text-paper-soft shadow-xs transition-colors hover:bg-[#9d3125]"
          >
            回到信箱首页
          </Link>
          <Link
            href="/#write"
            className="font-hei text-[12px] tracking-wider text-ink-faint transition-colors hover:text-seal"
          >
            新写一封信 →
          </Link>
        </div>
      </main>
    </div>
  );
}
