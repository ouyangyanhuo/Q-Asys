import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { BoxMark, Postmark } from "@/components/stamp-badge";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* 左右留白与页脚对齐 */}
      <main className="mx-auto flex w-full max-w-[580px] flex-1 flex-col items-start px-5 py-24 md:px-10 md:py-32">
        {/* 邮局的退件章 */}
        <div className="flex items-center gap-5">
          <BoxMark tilt={-5} className="stamp-press">
            查无此函
          </BoxMark>
          <span className="label">四〇四</span>
        </div>

        <h1 className="mt-9 font-song text-title leading-[1.3] text-ink md:text-[2.125rem]">
          此函不在信箱中。
        </h1>

        <p className="mt-5 font-kai text-body leading-[2.1] text-ink-soft">
          或未示人，或已被悄悄收进深处的抽屉。
          <br />
          世间许多声音，原本就只属于一个人。
        </p>

        <Postmark place="尺素" sub="退回" date="" waves className="mt-8" />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/" className="btn btn-seal">
            归信箱
          </Link>
          {/* 外层撑出可点的高度，朱线仍贴着字 */}
          <Link href="/#write" className="inline-flex min-h-9 items-center">
            <span className="link font-song text-small">
              另修一笺 <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </main>

      <SiteFooter maxWidth="max-w-[580px]" />
    </div>
  );
}
