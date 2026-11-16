import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import {
  PostageStamp,
  CancellationMark,
  WaxSeal,
  type StampTheme,
  type StampColor,
} from "@/components/stamp-badge";
import { LetterActions } from "@/components/letter-actions";
import { formatFullDate } from "@/lib/format";
import type { Question } from "@/lib/types";

const STAMP_THEMES: StampTheme[] = [
  "lantern",
  "moon",
  "quill",
  "boat",
  "letter",
  "sprout",
];

const STAMP_COLORS: StampColor[] = [
  "seal",
  "amber",
  "forest",
  "indigo",
  "ink",
];

/**
 * 单封信的版面。
 * 公开信（ISR）与候复私函（动态）共用这一套排版，只有提示条不同。
 */
export function LetterView({
  q,
  owned = false,
}: {
  q: Question;
  owned?: boolean;
}) {
  const hash = Math.abs(
    q.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
  const stampTheme = STAMP_THEMES[hash % STAMP_THEMES.length];
  const stampColor = STAMP_COLORS[(hash >> 2) % STAMP_COLORS.length];
  const stampPrice = String(50 + (hash % 50));
  const postmarkDate = q.createdAt
    ? q.createdAt.slice(0, 7).replace("-", ".")
    : "2026.11";

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-[780px] flex-1 px-5 py-12 md:px-8 md:py-20">
        {/* 面包屑导航与返回 */}
        <div className="flex items-center justify-between">
          <Link
            href="/#letters"
            className="flex items-center gap-1.5 font-hei text-[11.5px] tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
          >
            <span>←</span>
            <span>归 信 箱</span>
          </Link>

          <span className="font-mono text-[11px] tracking-widest text-ink-faint/70">
            TIMELESS ARCHIVE
          </span>
        </div>

        {/* 信笺主体卡片 */}
        <article className="sheet-shadow reveal relative mt-8 overflow-hidden border border-rule bg-paper-soft px-7 py-12 md:px-14 md:py-16">
          {/* 八行笺内框装饰 */}
          <div className="pointer-events-none absolute inset-3 border border-seal/15" />

          {/* 右上角邮品装点 */}
          <div className="absolute right-6 top-6 flex items-center gap-2 sm:right-10 sm:top-8">
            <CancellationMark
              date={postmarkDate}
              location="尺素"
              className="hidden sm:inline-flex scale-85"
            />
            <PostageStamp
              theme={stampTheme}
              color={stampColor}
              price={stampPrice}
              title="尺素"
              className="scale-90"
            />
          </div>

          {/* 顶部信头元信息 */}
          <div className="flex items-center gap-3 font-hei text-[11.5px] tracking-[0.24em] text-ink-faint">
            <span className="font-mono tracking-normal text-ink-faint/90">
              LETTER
            </span>
            <span className="h-px w-10 bg-rule" />
            <time dateTime={q.createdAt}>{formatFullDate(q.createdAt)}</time>
          </div>

          {/* 提问正文 */}
          <p className="mt-10 max-w-[90%] font-kai text-[23px] leading-[1.88] text-ink md:text-[27px]">
            {q.body}
          </p>

          {q.nickname ? (
            <p className="mt-4 text-right font-kai text-[13px] text-ink-faint">
              —— {q.nickname}
            </p>
          ) : (
            <p className="mt-4 text-right font-kai text-[12px] text-ink-faint/70">
              —— 匿名旅人
            </p>
          )}

          <div className="mt-10 h-px bg-rule" />

          {owned && (
            <div className="mt-8 border border-dashed border-seal/35 bg-seal/[0.035] px-4 py-3 font-kai text-[12.5px] leading-relaxed text-ink-soft">
              此函尚在候复，只有你自己看得见。
              收信人展读之后，回音会补在此处，旁人便可读到。
            </div>
          )}

          {/* 回信正文 */}
          {q.answer ? (
            <div className="mt-9 flex gap-4">
              <span className="mt-[6px] flex h-7 w-7 shrink-0 items-center justify-center border border-seal/45 font-kai text-[12px] leading-none text-seal shadow-xs">
                答
              </span>
              <div className="space-y-4">
                <p className="whitespace-pre-wrap font-song text-[16.5px] leading-[2.15] text-ink-soft">
                  {q.answer}
                </p>
                {q.answeredAt && (
                  <p className="font-hei text-[11px] tracking-wider text-ink-faint/80">
                    复于 {formatFullDate(q.answeredAt)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-9 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-rule" />
              <p className="font-kai text-[13.5px] text-ink-faint">
                此函尚在箧中，待收信人展读，细细作复。
              </p>
            </div>
          )}

          {/* 交互操作栏：候复中的私函不做分享与共鸣 */}
          {q.status === "published" && (
            <div className="mt-12 border-t border-dashed border-rule/80 pt-6">
              <LetterActions question={q} />
            </div>
          )}

          {/* 底部印章与署印 */}
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-rule/70 pt-6">
            <div className="flex items-center gap-3">
              <WaxSeal character="信" size="md" />
              <div>
                <p className="font-song text-[14px] tracking-[0.2em] text-ink">
                  尺素
                </p>
                <p className="mt-0.5 font-hei text-[11px] tracking-[0.22em] text-ink-faint">
                  {q.answeredAt ? `复于 ${formatFullDate(q.answeredAt)}` : "静候复音"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/#write"
                className="border-b border-seal/40 pb-0.5 font-hei text-[11.5px] tracking-[0.18em] text-seal transition-colors hover:border-seal hover:text-[#9d3125]"
              >
                我亦有言欲寄 →
              </Link>
            </div>
          </div>
        </article>
      </main>

      <SiteFooter maxWidth="max-w-[780px]" />
    </div>
  );
}
