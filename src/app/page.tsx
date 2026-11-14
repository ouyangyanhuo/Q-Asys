import { ComposeCard } from "@/components/compose-card";
import { LettersStream } from "@/components/letters-stream";
import { SealMark, SiteHeader } from "@/components/site-header";
import { PostageStamp, CancellationMark } from "@/components/stamp-badge";
import { getStats, listPublished } from "@/lib/store";

export const revalidate = 60;

export default async function HomePage() {
  const [letters, stats] = await Promise.all([listPublished(60), getStats()]);
  const total = stats.published;

  return (
    <div className="relative min-h-dvh">
      <SiteHeader />

      <main>
        {/* 首屏：写信台与题头 */}
        <section className="mx-auto max-w-[1180px] px-6 md:px-10">
          <div className="grid items-start gap-12 pb-20 pt-12 md:pt-18 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
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

              <div className="reveal flex items-center gap-3 font-hei text-[11px] tracking-[0.38em] text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-seal/80" />
                <span>独白与回信 · 始于二〇二六年十一月</span>
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
                在这里留下一句想问的话，可以不留姓名。
                <br />
                世事匆忙，我会一封一封慢读，写下回音。
              </p>

              {/* 实时统计与状态标牌 */}
              <div
                className="reveal mt-11 flex flex-wrap items-center gap-x-5 gap-y-3 font-hei text-[11px] tracking-[0.15em] text-ink-faint"
                style={{ animationDelay: "220ms" }}
              >
                <div className="flex items-center gap-1.5">
                  <span>已收</span>
                  <span className="font-mono text-[14.5px] font-medium text-ink">
                    {total}
                  </span>
                  <span>封来信</span>
                </div>

                <span className="h-3 w-px bg-rule" />

                <div className="flex items-center gap-1.5">
                  <span>已回</span>
                  <span className="font-mono text-[14.5px] font-medium text-ink">
                    {stats.answered}
                  </span>
                  <span>封回音</span>
                </div>

                <span className="h-3 w-px bg-rule" />

                <div className="flex items-center gap-2">
                  <span className="breathe h-2 w-2 rounded-full bg-seal shadow-[0_0_8px_rgba(178,58,44,0.6)]" />
                  <span className="text-ink-soft">信箱开放中</span>
                </div>
              </div>

              {/* 邮戳印鉴氛围装点 */}
              <div
                className="reveal mt-12 hidden items-center gap-5 sm:flex"
                style={{ animationDelay: "280ms" }}
              >
                <CancellationMark date="2026.11" location="拾光" />
                <div className="font-kai text-[12px] leading-relaxed text-ink-faint/80">
                  见字如面 · 纸短情长
                  <br />
                  所有的字，都在这里被郑重收下
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
                <PostageStamp theme="lantern" color="seal" price="80" title="拾光" />
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

      {/* 底部页脚 */}
      <footer className="border-t border-rule/80 bg-paper-soft/40">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center md:px-10">
          <div>
            <p className="font-kai text-[14px] text-ink-soft">
              所有的字都会被认真读。
            </p>
            <p className="mt-1 font-hei text-[10.5px] tracking-wider text-ink-faint">
              不必追问谁写下，只需知道曾有人这样思念与生活。
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SealMark className="h-8 w-8 text-[13px]" />
            <div className="text-right">
              <p className="font-hei text-[10px] tracking-[0.24em] text-ink-faint">
                匿名 · 不记录身份 · 拾光信箱
              </p>
              <p className="font-mono text-[9px] text-ink-faint/70">
                TIMELESS POSTBOX © 2026
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
