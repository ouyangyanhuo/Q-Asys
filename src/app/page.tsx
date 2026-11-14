import { ComposeCard } from "@/components/compose-card";
import { LettersStream } from "@/components/letters-stream";
import { SiteFooter } from "@/components/site-footer";
import { PostageStamp, CancellationMark } from "@/components/stamp-badge";
import { getStats, listPublished } from "@/lib/store";

export const revalidate = 60;

export default async function HomePage() {
  const [letters, stats] = await Promise.all([listPublished(60), getStats()]);
  const total = stats.published;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <main className="flex-1">
        {/* 首屏：写信台与题头 */}
        <section className="mx-auto max-w-[1180px] px-6 md:px-10">
          <div className="grid items-start gap-12 pb-20 pt-16 md:pt-24 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
            {/* 左侧诗意题头与信箱状态 */}
            <div className="relative lg:pt-2">
              {/* 背景装饰：微风中轻浮的折纸信笺暗纹 */}
              <div
                className="float-gentle pointer-events-none absolute -right-6 -top-6 hidden opacity-40 select-none md:block"
                aria-hidden="true"
              >
                <svg width="90" height="90" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-seal/25">
                  <path d="M10 25 L50 60 L90 25 L90 75 L10 75 Z" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 25 L50 60 L90 25" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 75 L42 48" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M90 75 L58 48" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="reveal flex items-center gap-3">
                <span className="font-song text-[15px] tracking-[0.3em] text-ink-soft">
                  尺素
                </span>
                <span className="h-3 w-px bg-rule" />
                <span className="font-hei text-[9.5px] tracking-[0.3em] text-ink-faint">
                  LETTERS, UNSIGNED
                </span>
              </div>

              <h1
                className="reveal mt-7 font-song text-[clamp(2.8rem,6.4vw,4.6rem)] leading-[1.14] tracking-[-0.012em] text-ink"
                style={{ animationDelay: "80ms" }}
              >
                有些话，
                <br />
                <span className="relative inline-block">
                  不必署名
                  <svg
                    viewBox="0 0 240 14"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="underline-draw absolute -bottom-3 left-0 h-3 w-full overflow-visible"
                  >
                    <path
                      d="M2 9 C 52 3, 96 12, 140 6 S 208 3, 238 8"
                      fill="none"
                      stroke="var(--color-seal)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.65"
                    />
                  </svg>
                </span>
                。
              </h1>

              <p
                className="reveal mt-9 max-w-[24em] font-kai text-[17px] leading-[2.15] text-ink-soft md:text-[18px]"
                style={{ animationDelay: "160ms" }}
              >
                有言欲问，不必具名。
                <br />
                世路匆忙，容我逐函细读，徐徐作复。
              </p>

              {/* 实时统计与状态标牌 */}
              <div
                className="reveal mt-11 flex flex-wrap items-center gap-x-5 gap-y-3 font-hei text-[11px] tracking-[0.15em] text-ink-faint"
                style={{ animationDelay: "220ms" }}
              >
                <div className="flex items-center gap-1.5">
                  <span>收函</span>
                  <span className="font-mono text-[14.5px] font-medium text-ink">
                    {total}
                  </span>
                  <span>通</span>
                </div>

                <span className="h-3 w-px bg-rule" />

                <div className="flex items-center gap-1.5">
                  <span>复函</span>
                  <span className="font-mono text-[14.5px] font-medium text-ink">
                    {stats.answered}
                  </span>
                  <span>通</span>
                </div>
              </div>

              {/* 邮戳印鉴氛围装点 */}
              <div
                className="reveal mt-12 hidden items-center gap-5 sm:flex"
                style={{ animationDelay: "280ms" }}
              >
                <CancellationMark date="2026.11" location="尺素" />
                <div className="font-kai text-[12px] leading-relaxed text-ink-faint/80">
                  见字如面 · 纸短情长
                  <br />
                  凡有所书，皆郑重受之。
                </div>
              </div>
            </div>

            {/* 右侧写信信笺卡片 */}
            <ComposeCard />
          </div>
        </section>

        {/* 读信区域 */}
        <section
          id="letters"
          className="mx-auto max-w-[1180px] scroll-mt-20 px-6 md:px-10"
        >
          <div className="grid gap-10 border-t border-rule pt-14 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-16">
            {/* 侧栏 */}
            <aside className="self-start lg:sticky lg:top-24">
              <div className="flex items-baseline gap-2">
                <h2 className="font-song text-[28px] tracking-[0.08em] text-ink">
                  来信
                </h2>
                <span className="font-mono text-[11px] text-ink-faint">
                  / LETTERS
                </span>
              </div>

              <p className="mt-3 font-kai text-[12.5px] leading-relaxed text-ink-faint">
                有些声音随风散了，
                <br />
                有些被留在了这里。
              </p>

              <div className="mt-7 hidden flex-col gap-5 lg:flex">
                <PostageStamp theme="lantern" color="seal" price="80" title="尺素" />
                <div className="flex h-11 w-11 -rotate-6 items-center justify-center border border-seal/35 font-kai text-[16px] text-seal/80 shadow-2xs">
                  笺
                </div>
              </div>
            </aside>

            {/* 信件流交互展示 */}
            <div className="max-w-[720px] pb-32">
              <LettersStream initialLetters={letters} total={total} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
