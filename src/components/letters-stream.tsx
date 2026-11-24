"use client";

import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  // 自己投出、尚未过审的那几封。服务端读 cookie 会把整页变成动态渲染，
  // 所以改为挂载后单独取一次，只为本人钉在手卷最前端。
  const [mine, setMine] = useState<Question[]>([]);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const inViewRef = useRef(false);

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

    const anchor = anchorRef.current;
    let mineIo: IntersectionObserver | null = null;
    let viewIo: IntersectionObserver | null = null;

    if (anchor && "IntersectionObserver" in window) {
      mineIo = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            load();
            mineIo?.disconnect();
          }
        },
        { rootMargin: "200px 0px" },
      );
      mineIo.observe(anchor);

      viewIo = new IntersectionObserver(
        (entries) => {
          inViewRef.current = entries.some((entry) => entry.isIntersecting);
        },
        { threshold: 0.2 },
      );
      viewIo.observe(anchor);
    } else {
      load();
    }

    window.addEventListener("qasys-mine-refresh", load);

    return () => {
      alive = false;
      mineIo?.disconnect();
      viewIo?.disconnect();
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
          (l.answer && l.answer.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [initialLetters, mine, filter, keyword]);

  // 筛选或搜索变化时，手卷回到卷首
  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [filter, keyword]);

  const scrollToIndex = useCallback((idx: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[idx];
    if (!track || !card) return;
    const targetLeft =
      card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    setActiveIndex(idx);
  }, []);

  // 监听横向滚动，实时计算最居中的那一幅册页
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const updateActive = () => {
      raf = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < filteredLetters.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      setActiveIndex(bestIdx);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateActive);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
    };
  }, [filteredLetters.length]);

  // 鼠标滚轮横推手卷（碰到卷首/卷尾或长信内部纵滚时自动放行给整页，绝不卡死）
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let snapTimer = 0;
    const onWheel = (e: WheelEvent) => {
      // 触控板本身已是横向滑动，交给原生 120fps 惯性
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;

      // 若指针停在可纵滚的长信正文里，优先让正文上下滚动
      const bodyEl = (e.target as HTMLElement | null)?.closest(
        ".handscroll-body",
      ) as HTMLElement | null;
      if (bodyEl && bodyEl.scrollHeight > bodyEl.clientHeight + 2) {
        const atTop = bodyEl.scrollTop <= 1 && e.deltaY < 0;
        const atBottom =
          bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 1 &&
          e.deltaY > 0;
        if (!atTop && !atBottom) return;
      }

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 2) return;

      const atStart = track.scrollLeft <= 2 && e.deltaY < 0;
      const atEnd = track.scrollLeft >= maxScroll - 2 && e.deltaY > 0;
      if (atStart || atEnd) return;

      e.preventDefault();
      track.setAttribute("data-dragging", "true");
      track.scrollLeft += e.deltaY * 1.15;

      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        track.removeAttribute("data-dragging");
      }, 160);
    };

    track.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(snapTimer);
      track.removeEventListener("wheel", onWheel);
    };
  }, [filteredLetters.length]);

  // 鼠标拖拽展卷
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input")) return;
      isDown = true;
      dragged = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 6) {
        dragged = true;
        track.setAttribute("data-dragging", "true");
      }
      if (dragged) {
        track.scrollLeft = startLeft - dx * 1.15;
      }
    };

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      if (dragged) {
        track.removeAttribute("data-dragging");
        dragged = false;
      }
    };

    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  // 键盘 ← / → 展卷翻阅
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (randomModalOpen || !inViewRef.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && activeIndex > 0) {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        activeIndex < filteredLetters.length - 1
      ) {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filteredLetters.length, randomModalOpen, scrollToIndex]);

  const answeredCount = useMemo(
    () => initialLetters.filter((l) => Boolean(l.answer)).length,
    [initialLetters],
  );
  const waitingCount = useMemo(
    () => initialLetters.filter((l) => !l.answer).length + mine.length,
    [initialLetters, mine],
  );
  const totalCount = initialLetters.length + mine.length;

  const currentLetter = filteredLetters[activeIndex];
  const currentNum = currentLetter
    ? (letterNumberMap.get(currentLetter.id) ?? 0)
    : 0;

  return (
    <div ref={anchorRef} className="space-y-6">
      {/* 顶部交互过滤器与搜索栏 */}
      <div className="mx-auto max-w-[1180px] px-6 md:px-10">
        <div className="flex flex-col gap-4 border-b border-rule/70 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
                filter === "all"
                  ? "bg-seal/10 font-medium text-seal shadow-2xs"
                  : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
              }`}
            >
              全部来鸿 ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("answered")}
              className={`rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
                filter === "answered"
                  ? "bg-seal/10 font-medium text-seal shadow-2xs"
                  : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
              }`}
            >
              已 复 ({answeredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("waiting")}
              className={`rounded-xs px-3.5 py-1.5 font-hei text-[12px] tracking-wider transition-all duration-300 ${
                filter === "waiting"
                  ? "bg-seal/10 font-medium text-seal shadow-2xs"
                  : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
              }`}
            >
              候 复 ({waitingCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-60">
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

            <button
              type="button"
              onClick={() => setRandomModalOpen(true)}
              title="信手拈来一封"
              className="flex items-center gap-1.5 whitespace-nowrap border border-seal/40 bg-seal/[0.04] px-3.5 py-1.5 font-hei text-[11px] tracking-wider text-seal shadow-2xs transition-all duration-300 hover:scale-102 hover:bg-seal/[0.1] active:scale-95"
            >
              <RefreshCw className="h-3 w-3" />
              <span>随手一拈</span>
            </button>
          </div>
        </div>
      </div>

      {/* 手卷主体 */}
      {filteredLetters.length === 0 ? (
        <div className="mx-auto max-w-[1180px] px-6 md:px-10">
          <div className="border border-dashed border-rule/80 px-6 py-20 text-center">
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
        </div>
      ) : (
        <div className="relative">
          {/* 手卷上下微细装裱绫边 */}
          <div
            className="pointer-events-none mx-auto max-w-[1320px] border-t border-rule/45"
            aria-hidden="true"
          />

          {/* 左右悬浮翻卷按钮（桌面端） */}
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex <= 0}
            aria-label="上一封"
            title="上一封（←）"
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rule/85 bg-paper-soft/85 text-ink-soft shadow-sm backdrop-blur-xs transition-all duration-300 hover:border-seal/55 hover:text-seal disabled:pointer-events-none disabled:opacity-0 md:flex xl:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToIndex(
                Math.min(filteredLetters.length - 1, activeIndex + 1),
              )
            }
            disabled={activeIndex >= filteredLetters.length - 1}
            aria-label="下一封"
            title="下一封（→）"
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-rule/85 bg-paper-soft/85 text-ink-soft shadow-sm backdrop-blur-xs transition-all duration-300 hover:border-seal/55 hover:text-seal disabled:pointer-events-none disabled:opacity-0 md:flex xl:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* 横向展卷轨道 */}
          <div className="handscroll-stage">
            <div ref={trackRef} className="handscroll-track">
              {filteredLetters.map((q, i) => (
                <div
                  key={q.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  data-active={i === activeIndex ? "true" : "false"}
                  className="handscroll-card"
                >
                  <Letter
                    q={q}
                    number={letterNumberMap.get(q.id) ?? 0}
                    index={i}
                    active={i === activeIndex}
                    onSelect={() => scrollToIndex(i)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="pointer-events-none mx-auto max-w-[1320px] border-b border-rule/45"
            aria-hidden="true"
          />

          {/* 底部古籍刻度卷轴条 */}
          <div className="mx-auto mt-5 max-w-[1180px] px-6 md:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* 当前展卷序号 */}
              <div className="flex items-center gap-3 font-mono text-[11.5px] tracking-[0.16em] text-ink-faint">
                <span>
                  <strong className="font-medium text-seal">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </strong>{" "}
                  / {String(filteredLetters.length).padStart(2, "0")}
                </span>
                {currentLetter && (
                  <>
                    <span className="h-2.5 w-px bg-rule" />
                    <span className="font-kai tracking-[0.14em]">
                      {currentLetter.status === "pending"
                        ? "私 函"
                        : `NO.${String(currentNum).padStart(3, "0")}`}
                    </span>
                  </>
                )}
              </div>

              {/* 可点击跳转的古籍刻度尺 */}
              <div
                role="tablist"
                aria-label="手卷刻度"
                className="flex flex-1 items-center justify-center gap-[3px] overflow-hidden px-2 py-1 sm:max-w-[440px]"
              >
                {filteredLetters.map((q, i) => {
                  const isCurrent = i === activeIndex;
                  const num = letterNumberMap.get(q.id) ?? 0;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={
                        q.status === "pending"
                          ? "跳至私函"
                          : `跳至 NO.${String(num).padStart(3, "0")}`
                      }
                      title={
                        q.status === "pending"
                          ? "私函"
                          : `NO.${String(num).padStart(3, "0")}`
                      }
                      onClick={() => scrollToIndex(i)}
                      className="group flex h-5 items-center justify-center px-[1px]"
                    >
                      <span
                        className={`block w-[2px] rounded-full transition-all duration-300 ${
                          isCurrent
                            ? "h-4 bg-seal"
                            : "h-2 bg-rule group-hover:h-3 group-hover:bg-seal/60"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 交互提示 */}
              <p className="hidden font-hei text-[11px] tracking-[0.16em] text-ink-faint/80 md:block">
                拖拽 · 滚轮 · ← → 展卷
              </p>
            </div>
          </div>
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
