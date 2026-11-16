"use client";

import { RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/types";
import { Letter } from "./letter";
import { RandomLetterModal } from "./random-letter-modal";

interface LettersStreamProps {
  initialLetters: Question[];
  total: number;
}

export function LettersStream({ initialLetters, total }: LettersStreamProps) {
  const [filter, setFilter] = useState<"all" | "answered" | "waiting">("all");
  const [keyword, setKeyword] = useState("");
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(12);

  // 自己投出、尚未过审的那几封。服务端读 cookie 会把整页变成动态渲染，
  // 所以改为挂载后单独取一次，只为本人把这几封钉在最上方。
  const [mine, setMine] = useState<Question[]>([]);

  useEffect(() => {
    let alive = true;

    const load = () => {
      fetch("/api/mine", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { pending: [] }))
        .then((data: { pending?: Question[] }) => {
          if (alive) setMine(data.pending ?? []);
        })
        .catch(() => undefined);
    };

    load();
    // 刚投完一封信时立刻取回来，不必刷新页面
    window.addEventListener("qasys-mine-refresh", load);
    return () => {
      alive = false;
      window.removeEventListener("qasys-mine-refresh", load);
    };
  }, []);

  // 保证无论经过何种筛选与搜索，每封信的序号（如 NO.042）始终真实恒定
  const letterNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    initialLetters.forEach((letter, index) => {
      map.set(letter.id, total - index);
    });
    return map;
  }, [initialLetters, total]);

  const filteredLetters = useMemo(() => {
    // 候复中的私函永远排在最前，且只出现在「全部」与「候复」两栏
    const pinned = filter === "answered" ? [] : mine;
    let result = [...pinned, ...initialLetters];

    if (filter === "answered") {
      result = result.filter((l) => Boolean(l.answer));
    } else if (filter === "waiting") {
      result = result.filter((l) => !l.answer);
    }

    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.body.toLowerCase().includes(q) ||
          (l.nickname && l.nickname.toLowerCase().includes(q)) ||
          (l.answer && l.answer.toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialLetters, mine, filter, keyword]);

  const visibleLetters = filteredLetters.slice(0, displayCount);
  const hasMore = displayCount < filteredLetters.length;

  const answeredCount = useMemo(
    () => initialLetters.filter((l) => Boolean(l.answer)).length,
    [initialLetters]
  );
  const waitingCount = useMemo(
    () => initialLetters.filter((l) => !l.answer).length + mine.length,
    [initialLetters, mine]
  );
  const totalCount = initialLetters.length + mine.length;

  return (
    <div className="space-y-8">
      {/* 顶部交互过滤器与搜索栏 */}
      <div className="flex flex-col gap-4 border-b border-rule/70 pb-5 md:flex-row md:items-center md:justify-between">
        {/* 标签切换栏 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`group relative rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
              filter === "all"
                ? "bg-seal/10 text-seal font-medium shadow-2xs"
                : "text-ink-faint hover:text-ink hover:bg-paper-deep/30"
            }`}
          >
            全部来鸿 ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("answered")}
            className={`group relative rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
              filter === "answered"
                ? "bg-seal/10 text-seal font-medium shadow-2xs"
                : "text-ink-faint hover:text-ink hover:bg-paper-deep/30"
            }`}
          >
            已 复 ({answeredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("waiting")}
            className={`group relative rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
              filter === "waiting"
                ? "bg-seal/10 text-seal font-medium shadow-2xs"
                : "text-ink-faint hover:text-ink hover:bg-paper-deep/30"
            }`}
          >
            候 复 ({waitingCount})
          </button>
        </div>

        {/* 搜索框与随机抽取按钮 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="寻笺，或寻一个名字…"
              className="w-full border-b border-rule bg-transparent py-1.5 pl-6 pr-6 font-kai text-[12.5px] text-ink outline-none transition-colors placeholder:text-ink-faint/50 focus:border-seal/70"
            />
            <Search className="pointer-events-none absolute left-0.5 top-2 h-3.5 w-3.5 text-ink-faint/60" />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-0 top-1.5 font-mono text-[13px] text-ink-faint hover:text-seal"
                title="拭去"
              >
                ×
              </button>
            )}
          </div>

          {/* 随机翻信按钮 */}
          <button
            type="button"
            onClick={() => setRandomModalOpen(true)}
            title="信手拈来一封"
            className="flex items-center gap-1.5 whitespace-nowrap border border-seal/40 bg-seal/[0.04] px-3.5 py-1.5 font-hei text-[11px] tracking-wider text-seal shadow-2xs transition-all duration-300 hover:bg-seal/[0.1] hover:scale-102 active:scale-95"
          >
            <RefreshCw className="h-3 w-3" />
            <span>随手一拈</span>
          </button>
        </div>
      </div>

      {/* 信件列表展示 */}
      {visibleLetters.length === 0 ? (
        <div className="border border-dashed border-rule/80 px-6 py-16 text-center">
          <p className="font-kai text-[15px] leading-relaxed text-ink-faint">
            {keyword ? "未得相应之笺。" : "此栏尚无来函。"}
          </p>
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="mt-3 font-hei text-[11px] tracking-wider text-seal underline underline-offset-4 hover:text-seal-deep"
            >
              重新寻过
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {visibleLetters.map((q, i) => (
            <Letter
              key={q.id}
              q={q}
              number={letterNumberMap.get(q.id) ?? 0}
              index={i}
            />
          ))}

          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + 10)}
                className="group relative inline-flex items-center gap-2 border border-rule bg-paper-soft px-8 py-3 font-hei text-[12px] tracking-[0.25em] text-ink-soft shadow-xs transition-all duration-300 hover:border-seal/50 hover:text-seal active:scale-98"
              >
                <span>展读旧笺</span>
                <span className="font-mono text-[11px] text-ink-faint">
                  ({visibleLetters.length}/{filteredLetters.length})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 偶遇随机弹窗 */}
      <RandomLetterModal
        letters={initialLetters}
        isOpen={randomModalOpen}
        onClose={() => setRandomModalOpen(false)}
      />
    </div>
  );
}
