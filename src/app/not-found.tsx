import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto flex max-w-[560px] flex-col items-start px-6 py-32">
        <p className="font-mono text-[11px] tracking-[0.3em] text-ink-faint">
          404
        </p>
        <h1 className="mt-6 font-song text-[32px] leading-[1.4] text-ink">
          这封信不在信箱里。
        </h1>
        <p className="mt-5 font-kai text-[15px] leading-[2] text-ink-soft">
          可能还没公开，也可能被收信人收进了抽屉。
        </p>
        <Link
          href="/"
          className="mt-10 border-b border-seal/40 pb-1 font-hei text-[12px] tracking-[0.16em] text-seal transition-colors hover:border-seal"
        >
          回到信箱
        </Link>
      </main>
    </div>
  );
}
