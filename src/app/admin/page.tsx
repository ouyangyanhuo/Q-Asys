import Link from "next/link";
import {
  hideAction,
  logoutAction,
  publishAction,
} from "@/lib/admin-actions";
import { isDevOpen, requireAdmin } from "@/lib/auth";
import { formatDay, formatStamp } from "@/lib/format";
import { getStats, listAll, type QuestionStatus } from "@/lib/store";
import { AdminReplyBox } from "@/components/admin-reply-box";
import { WaxSeal, CancellationMark } from "@/components/stamp-badge";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

const LABEL: Record<QuestionStatus, string> = {
  pending: "待复",
  published: "已示人",
  hidden: "已藏",
};

const TONE: Record<QuestionStatus, string> = {
  pending: "text-seal bg-seal/10 border-seal/30",
  published: "text-[#3f5f4b] bg-[#3f5f4b]/10 border-[#3f5f4b]/30",
  hidden: "text-ink-faint bg-rule/30 border-rule",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tab?: string }>;
}) {
  await requireAdmin();

  const { id, tab } = await searchParams;
  const [allLetters, stats] = await Promise.all([listAll(), getStats()]);

  const currentTab = (tab || "all") as "all" | "pending" | "published" | "hidden";
  const letters =
    currentTab === "all"
      ? allLetters
      : allLetters.filter((l) => l.status === currentTab);

  const active =
    letters.find((l) => l.id === id) ??
    allLetters.find((l) => l.id === id) ??
    letters.find((l) => l.status === "pending") ??
    letters[0] ??
    null;

  return (
    <div className="min-h-dvh">
      {/* 顶部状态栏 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule/80 bg-paper-soft/90 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3">
          <WaxSeal character="斋" size="sm" />
          <span className="font-song text-[14px] tracking-[0.2em] text-ink">
            收信人工作台
          </span>
          <span className="hidden font-hei text-[10.5px] tracking-wider text-ink-faint sm:inline">
            待复 <span className="font-mono text-seal font-medium">{stats.pending}</span> 通
          </span>
        </div>

        <div className="flex items-center gap-4 font-hei text-[11px] text-ink-faint">
          {isDevOpen() && (
            <span className="border border-seal/35 px-2 py-0.5 text-[9.5px] tracking-[0.1em] text-seal">
              开发模式
            </span>
          )}
          <div className="hidden sm:block">
            <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          </div>
          <Link href="/" className="transition-colors hover:text-ink">
            往 信 箱
          </Link>
          <span className="h-3 w-px bg-rule" />
          <form action={logoutAction}>
            <button className="transition-colors hover:text-seal">告 退</button>
          </form>
        </div>
      </header>

      {/* 主体工作台 */}
      <div className="grid items-start lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* 左侧信件栏 */}
        <aside className="border-b border-rule/80 bg-paper-deep/20 lg:sticky lg:top-14 lg:h-[calc(100dvh_-_3.5rem)] lg:border-b-0 lg:border-r">
          {/* 筛选标签 */}
          <div className="flex items-center justify-between border-b border-rule/70 px-4 py-2.5 font-hei text-[11px]">
            <Link
              href="/admin?tab=all"
              className={`px-1.5 py-0.5 transition-colors ${currentTab === "all" ? "text-seal font-medium border-b-2 border-seal" : "text-ink-faint hover:text-ink"}`}
            >
              全部 ({allLetters.length})
            </Link>
            <Link
              href="/admin?tab=pending"
              className={`px-1.5 py-0.5 transition-colors ${currentTab === "pending" ? "text-seal font-medium border-b-2 border-seal" : "text-ink-faint hover:text-ink"}`}
            >
              待复 ({stats.pending})
            </Link>
            <Link
              href="/admin?tab=published"
              className={`px-1.5 py-0.5 transition-colors ${currentTab === "published" ? "text-seal font-medium border-b-2 border-seal" : "text-ink-faint hover:text-ink"}`}
            >
              已示 ({stats.published})
            </Link>
            <Link
              href="/admin?tab=hidden"
              className={`px-1.5 py-0.5 transition-colors ${currentTab === "hidden" ? "text-seal font-medium border-b-2 border-seal" : "text-ink-faint hover:text-ink"}`}
            >
              已藏
            </Link>
          </div>

          <div className="max-h-[45dvh] overflow-y-auto lg:max-h-[calc(100dvh_-_6.5rem)]">
            {letters.length === 0 ? (
              <p className="px-5 py-10 font-kai text-[13px] text-ink-faint">
                此类尚无来函。
              </p>
            ) : (
              <ul>
                {letters.map((l) => {
                  const selected = active?.id === l.id;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/admin?id=${l.id}&tab=${currentTab}`}
                        className={`block border-l-[3px] px-4 py-3.5 transition-colors ${
                          selected
                            ? "border-l-seal bg-paper/90 shadow-xs"
                            : "border-l-transparent hover:bg-paper/40"
                        }`}
                      >
                        <div className="flex items-center justify-between font-hei text-[10px] tracking-[0.14em]">
                          <span className="font-mono text-ink-faint">
                            {formatDay(l.createdAt)}
                          </span>
                          <span
                            className={`rounded-xs border px-1.5 py-0.2 text-[9px] ${TONE[l.status]}`}
                          >
                            {LABEL[l.status]}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-kai text-[13.5px] leading-[1.7] text-ink">
                          {l.body}
                        </p>
                        {l.nickname && (
                          <p className="mt-1 text-right font-kai text-[10.5px] text-ink-faint">
                            —— {l.nickname}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* 右侧主信件审阅与回信台 */}
        <main className="p-4 md:p-9">
          {!active ? (
            <div className="mx-auto max-w-[640px] border border-dashed border-rule px-8 py-20 text-center">
              <CancellationMark date="2026.11" location="信箱空" />
              <p className="mt-4 font-kai text-[14.5px] text-ink-faint">
                未选一函。
              </p>
            </div>
          ) : (
            <article className="sheet-shadow mx-auto max-w-[720px] border border-rule bg-paper-soft px-6 py-9 md:px-11 md:py-12">
              <div className="flex items-center justify-between font-hei text-[10px] tracking-[0.18em] text-ink-faint">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatStamp(active.createdAt)}</span>
                  <span className="h-2 w-px bg-rule" />
                  <span className="font-mono">ID: {active.id}</span>
                </div>
                <span
                  className={`rounded-xs border px-2 py-0.5 text-[9.5px] ${TONE[active.status]}`}
                >
                  {LABEL[active.status]}
                </span>
              </div>

              {/* 提问内容 */}
              <div className="mt-6">
                <p className="font-kai text-[20px] leading-[1.88] text-ink md:text-[22px]">
                  {active.body}
                </p>
                <p className="mt-3 text-right font-kai text-[12.5px] text-ink-faint">
                  {active.nickname ? `—— ${active.nickname}` : "—— 未落款"}
                </p>
              </div>

              <div className="mt-8 h-px bg-rule" />

              {/* 回信编辑器 */}
              <AdminReplyBox
                key={active.id}
                id={active.id}
                defaultAnswer={active.answer ?? ""}
              />

              {/* 信件状态管理操作 */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule/70 pt-6">
                <form action={publishAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button className="border border-rule px-4 py-2 font-hei text-[11px] tracking-[0.18em] text-ink-soft transition-colors hover:border-ink hover:text-ink">
                    仅示之，不作复
                  </button>
                </form>

                <form action={hideAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button className="border border-transparent px-4 py-2 font-hei text-[11px] tracking-[0.18em] text-ink-faint transition-colors hover:text-seal">
                    收入箧中
                  </button>
                </form>

                <p className="ml-auto font-kai text-[11px] text-ink-faint/70">
                  藏之后，唯案头可见，不示于外
                </p>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
