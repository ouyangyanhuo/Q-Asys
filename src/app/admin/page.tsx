import Link from "next/link";
import {
  hideAction,
  logoutAction,
  publishAction,
  saveAnswerAction,
} from "@/lib/admin-actions";
import { isDevOpen, requireAdmin } from "@/lib/auth";
import { formatDay, formatStamp } from "@/lib/format";
import { getStats, listAll, type QuestionStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

const LABEL: Record<QuestionStatus, string> = {
  pending: "待处理",
  published: "已公开",
  hidden: "已收起",
};

const TONE: Record<QuestionStatus, string> = {
  pending: "text-seal",
  published: "text-[#4d5f45]",
  hidden: "text-ink-faint/70",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdmin();

  const { id } = await searchParams;
  const [letters, stats] = await Promise.all([listAll(), getStats()]);
  const active =
    letters.find((l) => l.id === id) ??
    letters.find((l) => l.status === "pending") ??
    letters[0] ??
    null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-kraft/90 px-5 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 rotate-[-4deg] items-center justify-center border border-ink/35 font-kai text-[12px] leading-none text-ink/70">
            信
          </span>
          <span className="font-song text-[13px] tracking-[0.2em] text-ink">
            工作台
          </span>
          <span className="ml-1 font-hei text-[10px] tracking-[0.16em] text-ink-faint">
            待处理 {stats.pending}
          </span>
        </div>

        <div className="flex items-center gap-4 font-hei text-[11px] text-ink-faint">
          {isDevOpen() ? (
            <span className="border border-seal/35 px-2 py-0.5 text-[10px] tracking-[0.1em] text-seal">
              开发模式
            </span>
          ) : null}
          <Link href="/" className="transition-colors hover:text-ink">
            看信箱
          </Link>
          <form action={logoutAction}>
            <button className="transition-colors hover:text-ink">退出</button>
          </form>
        </div>
      </header>

      <div className="grid items-start lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="max-h-[45dvh] overflow-y-auto border-b border-ink/10 bg-[#efe6d2]/50 lg:sticky lg:top-14 lg:h-[calc(100dvh_-_3.5rem)] lg:max-h-none lg:border-b-0 lg:border-r">
          {letters.length === 0 ? (
            <p className="px-5 py-8 font-kai text-[13px] text-ink-faint">
              还没有任何来信。
            </p>
          ) : (
            <ul>
              {letters.map((l) => {
                const selected = active?.id === l.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/admin?id=${l.id}`}
                      className={`block border-l-2 px-4 py-3.5 transition-colors ${
                        selected
                          ? "border-l-seal bg-paper/75"
                          : "border-l-transparent hover:bg-paper/45"
                      }`}
                    >
                      <div className="flex items-center justify-between font-hei text-[10px] tracking-[0.14em] text-ink-faint">
                        <span className="font-mono tracking-normal">
                          {formatDay(l.createdAt)}
                        </span>
                        <span className={TONE[l.status]}>
                          {LABEL[l.status]}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 font-kai text-[13.5px] leading-[1.75] text-ink">
                        {l.body}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="p-4 md:p-9">
          {!active ? (
            <div className="mx-auto max-w-[640px] border border-dashed border-ink/20 px-8 py-16 text-center">
              <p className="font-kai text-[14px] text-ink-faint">
                信箱是空的。
              </p>
            </div>
          ) : (
            <article className="sheet-shadow mx-auto max-w-[720px] border border-rule bg-paper-soft px-6 py-9 md:px-11 md:py-12">
              <div className="flex items-center justify-between font-hei text-[10px] tracking-[0.18em] text-ink-faint">
                <span className="font-mono">{formatStamp(active.createdAt)}</span>
                <span className={TONE[active.status]}>
                  {LABEL[active.status]}
                </span>
              </div>

              <p className="mt-7 font-kai text-[20px] leading-[1.9] text-ink md:text-[22px]">
                {active.body}
              </p>
              {active.nickname ? (
                <p className="mt-3 text-right font-kai text-[12px] text-ink-faint">
                  —— {active.nickname}
                </p>
              ) : (
                <p className="mt-3 text-right font-kai text-[12px] text-ink-faint/60">
                  —— 未署名
                </p>
              )}

              <div className="mt-8 h-px bg-rule" />

              <form action={saveAnswerAction} className="mt-7">
                <input type="hidden" name="id" value={active.id} />
                <label
                  htmlFor="answer"
                  className="font-hei text-[11px] tracking-[0.2em] text-ink-faint"
                >
                  回信
                </label>
                <textarea
                  id="answer"
                  name="answer"
                  defaultValue={active.answer ?? ""}
                  rows={5}
                  placeholder="写点什么…"
                  className="ruled mt-3 w-full resize-none bg-transparent px-1 pb-2 pt-[10px] font-song text-[15px] leading-[34px] text-ink outline-none placeholder:font-kai placeholder:text-ink-faint/50"
                />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="bg-seal px-6 py-2.5 font-hei text-[11.5px] tracking-[0.3em] text-paper-soft shadow-[inset_0_0_0_1px_rgba(251,247,238,0.18)] transition-colors hover:bg-[#9d3125]"
                  >
                    回信并公开
                  </button>
                  <span className="font-kai text-[11.5px] text-ink-faint">
                    公开后会立刻出现在信箱里
                  </span>
                </div>
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule/70 pt-6">
                <form action={publishAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button className="border border-ink/25 px-4 py-2 font-hei text-[11px] tracking-[0.18em] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink">
                    仅公开
                  </button>
                </form>
                <form action={hideAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button className="border border-transparent px-4 py-2 font-hei text-[11px] tracking-[0.18em] text-ink-faint transition-colors hover:text-seal">
                    收起
                  </button>
                </form>
                <p className="ml-auto font-kai text-[11px] text-ink-faint/70">
                  收起后不删除，只是不公开
                </p>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
