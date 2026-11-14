import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { CancellationMark, WaxSeal } from "@/components/stamp-badge";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-[580px] flex-1 flex-col items-start px-6 py-24 md:py-32">
        <div className="flex items-center gap-3">
          <WaxSeal character="空" size="sm" />
          <span className="font-mono text-[12px] tracking-[0.25em] text-ink-faint">
            404 · LETTER MISSING
          </span>
        </div>

        <h1 className="mt-7 font-song text-[34px] leading-[1.3] text-ink">
          此函不在信箱中。
        </h1>

        <p className="mt-5 font-kai text-[16px] leading-[2.1] text-ink-soft">
          或未示人，或已被悄悄收进深处的抽屉。
          <br />
          世间许多声音，原本就只属于一个人。
        </p>

        <div className="my-8">
          <CancellationMark date="2026.11" location="未达" />
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Link
            href="/"
            className="bg-seal px-6 py-2.5 font-hei text-[12px] tracking-[0.2em] text-paper-soft shadow-xs transition-colors hover:bg-[#9d3125]"
          >
            归 信 箱
          </Link>
          <Link
            href="/#write"
            className="font-hei text-[12px] tracking-wider text-ink-faint transition-colors hover:text-seal"
          >
            另 修 一 笺 →
          </Link>
        </div>
      </main>

      <SiteFooter maxWidth="max-w-[580px]" />
    </div>
  );
}
