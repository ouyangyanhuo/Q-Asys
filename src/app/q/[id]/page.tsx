import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SealMark, SiteHeader } from "@/components/site-header";
import { formatFullDate } from "@/lib/format";
import { getQuestion } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q) return { title: "未找到 · 拾光信箱" };
  const excerpt = [...q.body].slice(0, 40).join("");
  return {
    title: `${excerpt} · 拾光信箱`,
    description: [...q.body].slice(0, 120).join(""),
  };
}

function Postmark() {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-6 h-20 w-20 rotate-[-14deg] text-seal/40 md:right-10 md:top-8 md:h-24 md:w-24"
    >
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <path id="pm-arc" d="M60,60 m-37,0 a37,37 0 1,1 74,0" fill="none" />
      <text fontSize="8" letterSpacing="1.6" fill="currentColor" className="font-hei">
        <textPath href="#pm-arc" startOffset="6%">
          拾光信箱 · POSTED
        </textPath>
      </text>
      <text
        x="60"
        y="64"
        textAnchor="middle"
        fontSize="15"
        fill="currentColor"
        className="font-kai"
      >
        已阅
      </text>
    </svg>
  );
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q || q.status !== "published") notFound();

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-20">
        <Link
          href="/#letters"
          className="font-hei text-[11px] tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
        >
          ← 回到信箱
        </Link>

        <article className="sheet-shadow reveal relative mt-8 overflow-hidden border border-rule bg-paper-soft px-7 py-12 md:px-14 md:py-16">
          <Postmark />

          <div className="flex items-center gap-3 font-hei text-[10px] tracking-[0.24em] text-ink-faint">
            <span className="font-mono tracking-normal">LETTER</span>
            <span className="h-px w-10 bg-rule" />
            <time dateTime={q.createdAt}>{formatFullDate(q.createdAt)}</time>
          </div>

          <p className="mt-9 font-kai text-[23px] leading-[1.85] text-ink md:text-[27px]">
            {q.body}
          </p>

          {q.nickname ? (
            <p className="mt-4 text-right font-kai text-[12px] text-ink-faint">
              —— {q.nickname}
            </p>
          ) : null}

          <div className="mt-10 h-px bg-rule" />

          {q.answer ? (
            <div className="mt-9 flex gap-4">
              <span className="mt-[7px] flex h-6 w-6 shrink-0 items-center justify-center border border-seal/45 font-kai text-[11px] leading-none text-seal">
                答
              </span>
              <p className="whitespace-pre-wrap font-song text-[16px] leading-[2.1] text-ink-soft">
                {q.answer}
              </p>
            </div>
          ) : (
            <p className="mt-9 font-kai text-[13px] text-ink-faint">
              这封信还在抽屉里，尚未回信。
            </p>
          )}

          <div className="mt-14 flex items-end justify-between gap-6 border-t border-rule/70 pt-7">
            <div className="flex items-center gap-3">
              <SealMark />
              <div>
                <p className="font-song text-[13px] tracking-[0.2em] text-ink">
                  拾光信箱
                </p>
                <p className="mt-1 font-hei text-[10px] tracking-[0.22em] text-ink-faint">
                  {q.answeredAt
                    ? `回于 ${formatFullDate(q.answeredAt)}`
                    : "待回"}
                </p>
              </div>
            </div>
            <Link
              href="/#write"
              className="border-b border-seal/40 pb-1 font-hei text-[11px] tracking-[0.18em] text-seal transition-colors hover:border-seal"
            >
              写一封
            </Link>
          </div>
        </article>
      </main>

      <footer className="mx-auto max-w-[760px] px-5 pb-16 md:px-8">
        <p className="font-kai text-[12px] text-ink-faint">
          这一封被收进了信箱。你也可以留下自己的。
        </p>
      </footer>
    </div>
  );
}
