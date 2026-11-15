import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { listByVisitor } from "@/lib/store";
import { readVisitorHash } from "@/lib/visitor";
import { formatDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的去信 · 尺素",
  robots: { index: false, follow: false },
};

const LABEL: Record<string, string> = {
  pending: "候复",
  published: "已示",
  hidden: "已藏",
};

export default async function MyLettersPage() {
  const visitorHash = await readVisitorHash();
  const letters = visitorHash ? await listByVisitor(visitorHash) : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline justify-between">
          <h1 className="font-song text-[27px] tracking-[0.1em] text-ink">
            我的去信
          </h1>
          <Link
            href="/"
            className="font-hei text-[11px] tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
          >
            归 信 箱
          </Link>
        </div>

        <p className="mt-4 font-kai text-[12.5px] leading-[2] text-ink-faint">
          此处只凭这一枚浏览器里的记号认人，
          <br />
          不记姓名，也不留痕迹。换一台机子，便寻不回了。
        </p>

        <div className="mt-9 h-px bg-rule" />

        {letters.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-kai text-[14px] text-ink-faint">
              尚无去信。
            </p>
            <Link
              href="/#write"
              className="mt-5 inline-block border-b border-seal/40 pb-0.5 font-hei text-[11.5px] tracking-[0.18em] text-seal transition-colors hover:border-seal"
            >
              去写第一封 →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {letters.map((letter) => {
              const answered = Boolean(letter.answer);
              return (
                <li key={letter.id}>
                  <Link
                    href={`/q/${letter.id}`}
                    className="group block border border-rule/80 bg-paper-soft/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-seal/40 hover:bg-paper-soft hover:shadow-[0_16px_34px_-22px_rgba(28,25,23,0.35)]"
                  >
                    <div className="flex items-center justify-between font-hei text-[10px] tracking-[0.2em] text-ink-faint">
                      <span>{formatDay(letter.createdAt)}</span>
                      <span
                        className={
                          letter.status === "published"
                            ? "text-seal/80"
                            : "text-ink-faint/80"
                        }
                      >
                        {LABEL[letter.status] ?? letter.status}
                        {letter.status === "pending" ? " · 仅你可见" : ""}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 font-kai text-[16px] leading-[1.85] text-ink">
                      {letter.body}
                    </p>

                    {answered && (
                      <p className="mt-2 line-clamp-1 border-t border-dashed border-rule/70 pt-2 font-song text-[12.5px] text-ink-faint">
                        答 · {letter.answer}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <SiteFooter maxWidth="max-w-[720px]" />
    </div>
  );
}
