import { ComposeCard } from "@/components/compose-card";
import { Letter } from "@/components/letter";
import { SealMark, SiteHeader } from "@/components/site-header";
import { getStats, listPublished } from "@/lib/store";

export const revalidate = 60;

export default async function HomePage() {
  const [letters, stats] = await Promise.all([listPublished(50), getStats()]);
  const total = stats.published;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-[1180px] px-6 md:px-10">
          <div className="grid items-start gap-14 pb-20 pt-16 md:pt-24 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20">
            <div className="lg:pt-4">
              <p className="reveal font-hei text-[11px] tracking-[0.38em] text-ink-faint">
                独白与回信 · 自二〇二四年
              </p>

              <h1
                className="reveal mt-8 font-song text-[clamp(2.7rem,6.2vw,4.5rem)] leading-[1.14] tracking-[-0.012em] text-ink"
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
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      opacity="0.55"
                    />
                  </svg>
                </span>
                。
              </h1>

              <p
                className="reveal mt-10 max-w-[23em] font-kai text-[17px] leading-[2.15] text-ink-soft md:text-[18px]"
                style={{ animationDelay: "160ms" }}
              >
                在这里留下一句想问的话，可以不署名。
                <br />
                我会一封一封读，慢慢回。
              </p>

              <div
                className="reveal mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 font-hei text-[11px] tracking-[0.14em] text-ink-faint"
                style={{ animationDelay: "220ms" }}
              >
                <span>
                  已收{" "}
                  <span className="font-mono text-[13px] text-ink">{total}</span>{" "}
                  封
                </span>
                <span className="h-3 w-px bg-rule" />
                <span>
                  已回{" "}
                  <span className="font-mono text-[13px] text-ink">
                    {stats.answered}
                  </span>{" "}
                  封
                </span>
                <span className="h-3 w-px bg-rule" />
                <span className="breathe h-1.5 w-1.5 rounded-full bg-seal" />
                <span>信箱开放中</span>
              </div>
            </div>

            <ComposeCard />
          </div>
        </section>

        <section
          id="letters"
          className="mx-auto max-w-[1180px] scroll-mt-20 px-6 md:px-10"
        >
          <div className="grid gap-10 border-t border-rule pt-14 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-16">
            <aside className="self-start lg:sticky lg:top-20">
              <h2 className="font-song text-[26px] tracking-[0.08em] text-ink">
                来信
              </h2>
              <p className="mt-2 font-hei text-[10px] tracking-[0.32em] text-ink-faint">
                LETTERS
              </p>
              <p className="mt-8 font-hei text-[11px] leading-[2.1] text-ink-faint">
                共 {total} 封
                <br />
                按时间倒序
              </p>
              <div className="mt-7 flex h-11 w-11 rotate-[-6deg] items-center justify-center border border-seal/35 font-kai text-[17px] text-seal/75">
                信
              </div>
            </aside>

            <div className="max-w-[660px] space-y-16 pb-28">
              {letters.length === 0 ? (
                <p className="font-kai text-[15px] leading-[2] text-ink-faint">
                  还没有公开的来信。
                  <br />
                  第一封，留给你。
                </p>
              ) : (
                letters.map((q, i) => (
                  <Letter key={q.id} q={q} number={total - i} index={i} />
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center md:px-10">
          <p className="font-kai text-[13px] text-ink-faint">
            所有的字都会被认真读。
          </p>
          <div className="flex items-center gap-4">
            <SealMark className="h-7 w-7 text-[12px]" />
            <p className="font-hei text-[10px] tracking-[0.24em] text-ink-faint">
              匿名 · 不记录身份 · 二〇二六
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
