import Link from "next/link";
import {
  hideAction,
  logoutAction,
  publishAction,
} from "@/lib/admin-actions";
import { isDevOpen, requireAdmin } from "@/lib/auth";
import { formatDay, formatStamp, toCn } from "@/lib/format";
import { getStats, listAll, type QuestionStatus } from "@/lib/store";
import { AdminReplyBox } from "@/components/admin-reply-box";
import { Seal } from "@/components/stamp-badge";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

type Tab = "all" | QuestionStatus;

const LABEL: Record<QuestionStatus, string> = {
  pending: "待复",
  published: "已示人",
  hidden: "已藏",
};

// 三种状态形状各异：实心方点、实线框、虚线框，不只靠颜色分辨
const TONE: Record<QuestionStatus, string> = {
  pending: "text-seal",
  published: "border border-pine/60 px-1.5 text-pine",
  hidden: "border border-dashed border-ink-faint/70 px-1.5 text-ink-faint",
};

const FILTERS: { tab: Tab; label: string }[] = [
  { tab: "all", label: "全部" },
  { tab: "pending", label: "待复" },
  { tab: "published", label: "已示" },
  { tab: "hidden", label: "已藏" },
];

const BAR_ITEM =
  "inline-flex min-h-9 items-center px-1 font-song text-label tracking-[0.2em] whitespace-nowrap text-ink-faint transition-colors";

function StatusTag({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1.5 font-hei text-label leading-[1.5] tracking-[0.08em] whitespace-nowrap ${TONE[status]}`}
    >
      {status === "pending" && (
        <span aria-hidden="true" className="size-1.5 bg-seal" />
      )}
      {LABEL[status]}
    </span>
  );
}

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

  // 只在当前筛选里找：否则切到「已示」时，右栏还可能停着一封已经不在左栏的信
  const active =
    letters.find((l) => l.id === id) ??
    letters.find((l) => l.status === "pending") ??
    letters[0] ??
    null;

  const counts: Record<Tab, number> = {
    all: allLetters.length,
    pending: stats.pending,
    published: stats.published,
    hidden: allLetters.filter((l) => l.status === "hidden").length,
  };

  return (
    <div className="min-h-dvh">
      {/* 顶栏 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-rule bg-paper-soft/90 px-4 backdrop-blur-md md:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <Seal text="斋" size="1.75rem" />
          <h1 className="min-w-0 truncate font-song text-small tracking-[0.2em] text-ink">
            收信人工作台
          </h1>
          {/* 窄屏上这个数目在下方筛选栏里也有，此处让位 */}
          <p className="hidden font-song text-label tracking-[0.12em] whitespace-nowrap text-ink-faint md:block">
            待复{" "}
            <span className="font-medium text-seal">{toCn(stats.pending)}</span>{" "}
            通
          </p>
        </div>

        <div className="flex flex-none items-center gap-2 sm:gap-3">
          {isDevOpen() && (
            <span className="border border-seal/50 px-2 py-0.5 font-hei text-label tracking-[0.1em] whitespace-nowrap text-seal">
              开发模式
            </span>
          )}
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/" className={`${BAR_ITEM} hover:text-ink`}>
            往信箱
          </Link>
          <span aria-hidden="true" className="h-3 w-px bg-ink-faint/40" />
          <form action={logoutAction} className="flex">
            <button type="submit" className={`${BAR_ITEM} hover:text-seal`}>
              告退
            </button>
          </form>
        </div>
      </header>

      <div className="grid items-start lg:grid-cols-[21rem_minmax(0,1fr)]">
        {/* 左栏信匣 */}
        <aside
          aria-label="信匣"
          className="flex flex-col border-b border-rule bg-paper-deep/40 lg:sticky lg:top-14 lg:h-[calc(100dvh_-_3.5rem)] lg:border-r lg:border-b-0"
        >
          {/* 筛选是带 query 的页面导航，所以是 nav + 链接，不是 tab */}
          <nav
            aria-label="依状态拣选"
            className="flex flex-none flex-wrap items-center justify-between gap-x-3 border-b border-rule px-4 font-hei text-label tracking-[0.08em]"
          >
            {FILTERS.map(({ tab: key, label }) => {
              const current = currentTab === key;
              return (
                <Link
                  key={key}
                  href={`/admin?tab=${key}`}
                  aria-current={current ? "page" : undefined}
                  className={`-mb-px inline-flex min-h-9 items-center gap-1 border-b-2 px-1 whitespace-nowrap transition-colors ${
                    current
                      ? "border-seal font-medium text-seal"
                      : "border-transparent text-ink-faint hover:text-ink"
                  }`}
                >
                  {label}
                  <span className="font-song tracking-normal">
                    {toCn(counts[key])}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="max-h-[45dvh] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1 lg:overscroll-contain">
            {letters.length === 0 ? (
              <p className="px-5 py-10 font-kai text-small text-ink-faint">
                此类尚无来函。
              </p>
            ) : (
              <ul>
                {letters.map((l) => {
                  const selected = active?.id === l.id;
                  return (
                    <li key={l.id} className="border-b border-rule/60">
                      {/* 焦点环收进框内，免得被滚动容器裁掉 */}
                      <Link
                        href={`/admin?id=${l.id}&tab=${currentTab}`}
                        aria-current={selected ? "true" : undefined}
                        className={`block border-l-[3px] px-4 py-3.5 transition-colors focus-visible:-outline-offset-2 ${
                          selected
                            ? "border-l-seal bg-paper"
                            : "border-l-transparent hover:bg-paper/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-song text-label tracking-[0.08em] text-ink-faint">
                            {formatDay(l.createdAt)}
                          </span>
                          <StatusTag status={l.status} />
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-kai text-small leading-[1.75] wrap-anywhere text-ink">
                          {l.body}
                        </p>
                        {l.nickname && (
                          <p className="mt-1 truncate text-right font-kai text-label text-ink-faint">
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

        {/* 右侧：审阅与作复 */}
        <main className="min-w-0 p-4 md:p-9">
          {!active ? (
            <div className="mx-auto flex max-w-[45rem] flex-col items-center border border-dashed border-ink-faint/40 px-8 py-20 text-center">
              <Seal text="空" variant="yang" />
              <p className="mt-5 font-kai text-body text-ink-faint">
                未选一函。
              </p>
            </div>
          ) : (
            <article className="sheet mx-auto max-w-[45rem] px-5 py-8 md:px-11 md:py-12">
              <h2 className="sr-only">来函</h2>

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-label text-ink-faint">
                  <time dateTime={active.createdAt} className="whitespace-nowrap">
                    {formatStamp(active.createdAt)}
                  </time>
                  <span aria-hidden="true" className="h-2.5 w-px bg-ink-faint/40" />
                  <span className="max-w-full min-w-0 truncate" title={active.id}>
                    ID: <span className="select-all">{active.id}</span>
                  </span>
                </div>
                <StatusTag status={active.status} />
              </div>

              {/* 来函正文：手写的问，用楷体 */}
              <div className="mt-6">
                <p className="font-kai text-letter leading-[1.9] wrap-anywhere whitespace-pre-wrap text-ink">
                  {active.body}
                </p>
                <p className="mt-3 text-right font-kai text-small text-ink-faint">
                  {active.nickname ? `—— ${active.nickname}` : "—— 未落款"}
                </p>
              </div>

              <hr className="mt-8 border-rule" />

              <AdminReplyBox
                key={active.id}
                id={active.id}
                defaultAnswer={active.answer ?? ""}
              />

              {/* 状态操作 */}
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-rule pt-6">
                <form action={publishAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button type="submit" className="btn btn-line btn-sm">
                    仅示之，不作复
                  </button>
                </form>

                <form action={hideAction}>
                  <input type="hidden" name="id" value={active.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-9 items-center px-2.5 font-song text-label tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
                  >
                    收入箧中
                  </button>
                </form>

                <p className="ml-auto font-kai text-label text-ink-faint">
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
