"use client";

import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { Letter } from "./letter";
import { RandomLetterModal } from "./random-letter-modal";
import { PostageStamp, Seal } from "./stamp-badge";

interface LettersStreamProps {
  initialLetters: Question[];
  total: number;
}

const PER_VOLUME = 6;

const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
function toCnVolume(n: number): string {
  if (n <= 10) return CN_NUM[n] ?? String(n);
  if (n < 20) return `十${CN_NUM[n - 10] ?? ""}`;
  return String(n);
}

export function LettersStream({ initialLetters, total }: LettersStreamProps) {
  const [filter, setFilter] = useState<"all" | "answered" | "waiting">("all");
  const [keyword, setKeyword] = useState("");
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unrolled, setUnrolled] = useState(false);
  const [runwayHeight, setRunwayHeight] = useState<number | null>(null);

  // 自己投出、尚未过审的那几封。服务端读 cookie 会把整页变成动态渲染，
  // 所以改为挂载后单独取一次，只为本人钉在初卷最前端。
  const [mine, setMine] = useState<Question[]>([]);

  const runwayRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const maxScrollRef = useRef(0);
  const inViewRef = useRef(false);

  // rAF 平滑阻尼驱动 translate3d，让纵滚映射横移如丝绸般连绵顺滑
  const targetXRef = useRef(0);
  const currentXRef = useRef(0);
  const rafRef = useRef(0);

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

    const runway = runwayRef.current;
    let mineIo: IntersectionObserver | null = null;
    let viewIo: IntersectionObserver | null = null;

    if (runway && "IntersectionObserver" in window) {
      mineIo = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            load();
            mineIo?.disconnect();
          }
        },
        { rootMargin: "200px 0px" },
      );
      mineIo.observe(runway);

      viewIo = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          inViewRef.current = visible;
          if (visible) setUnrolled(true);
        },
        { threshold: 0.08 },
      );
      viewIo.observe(runway);
    } else {
      load();
      setUnrolled(true);
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

  const totalVolumes = Math.max(
    1,
    Math.ceil(filteredLetters.length / PER_VOLUME),
  );
  const safeVolume = Math.min(volume, totalVolumes - 1);

  const volumeLetters = useMemo(
    () =>
      filteredLetters.slice(
        safeVolume * PER_VOLUME,
        (safeVolume + 1) * PER_VOLUME,
      ),
    [filteredLetters, safeVolume],
  );

  // 筛选或搜索变化时回到初卷
  useEffect(() => {
    setVolume(0);
    setActiveIndex(0);
  }, [filter, keyword]);

  // 切换卷轴：回到本卷起点并重播一次从页面中央展开的仪式感
  const switchVolume = useCallback((nextVolume: number) => {
    setVolume(nextVolume);
    setActiveIndex(0);
    setUnrolled(false);
    targetXRef.current = 0;
    currentXRef.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "translate3d(0px, 0, 0)";
    }

    const runway = runwayRef.current;
    if (runway) {
      const top = runway.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setUnrolled(true));
    });
  }, []);

  // 测量本卷横向总溢出宽度，换算成纵向吸顶跑道高度（1:1 绑定页面滚动）
  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const sheet = sheetRef.current;
      if (!viewport || !sheet || volumeLetters.length === 0) {
        maxScrollRef.current = 0;
        setRunwayHeight(null);
        return;
      }

      const overflow = Math.max(0, sheet.scrollWidth - viewport.clientWidth);
      maxScrollRef.current = overflow;
      if (overflow > 4) {
        setRunwayHeight(Math.round(window.innerHeight + overflow));
      } else {
        setRunwayHeight(null);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [volumeLetters.length, safeVolume]);

  // 绑定 window 纵向滚动 -> 画卷横向平移（滚动完本卷后自然解锁继续往下滚页面）
  useEffect(() => {
    const syncActiveCard = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const vpRect = viewport.getBoundingClientRect();
      const vpCenter = vpRect.left + vpRect.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < volumeLetters.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - vpCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      setActiveIndex(bestIdx);
    };

    const tick = () => {
      const sheet = sheetRef.current;
      if (!sheet) {
        rafRef.current = 0;
        return;
      }

      const diff = targetXRef.current - currentXRef.current;
      if (Math.abs(diff) < 0.4) {
        currentXRef.current = targetXRef.current;
        sheet.style.transform = `translate3d(${-currentXRef.current}px, 0, 0)`;
        syncActiveCard();
        rafRef.current = 0;
        return;
      }

      currentXRef.current += diff * 0.16;
      sheet.style.transform = `translate3d(${-currentXRef.current}px, 0, 0)`;
      syncActiveCard();
      rafRef.current = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const runway = runwayRef.current;
      const overflow = maxScrollRef.current;
      if (!runway || overflow <= 0) {
        targetXRef.current = 0;
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = runway.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      targetXRef.current = progress * overflow;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      window.removeEventListener("scroll", onScroll);
    };
  }, [volumeLetters.length, runwayHeight]);

  // 点击刻度尺或方向键时，平滑滚到对应的页面纵滚位置
  const scrollToCard = useCallback((idx: number) => {
    const runway = runwayRef.current;
    const viewport = viewportRef.current;
    const card = cardRefs.current[idx];
    const overflow = maxScrollRef.current;
    if (!runway || !viewport || !card || overflow <= 0) return;

    const vpRect = viewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardLeftUnshifted = cardRect.left - vpRect.left + currentXRef.current;
    const desiredX = Math.min(
      overflow,
      Math.max(0, cardLeftUnshifted - (vpRect.width - cardRect.width) / 2),
    );
    const runwayTop = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: runwayTop + desiredX, behavior: "smooth" });
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
        scrollToCard(activeIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        activeIndex < volumeLetters.length - 1
      ) {
        e.preventDefault();
        scrollToCard(activeIndex + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, randomModalOpen, scrollToCard, volumeLetters.length]);

  // 鼠标拖拽画卷：与页面纵滚跑道 1:1 联动，拖动手感丝滑且不越界；
  // 即使起手落在信件正文链接上也能拖拽（位移超过 5px 判定为拖拽并拦截误点）
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startScrollY = 0;
    let runwayTop = 0;
    let maxScrollY = 0;
    let lastX = 0;
    let velocity = 0;
    let suppressClick = false;

    const getTrack = () =>
      viewport.querySelector<HTMLElement>(".handscroll-track");

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (maxScrollRef.current <= 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, input, textarea, select")) return;

      const runway = runwayRef.current;
      if (!runway) return;

      isDown = true;
      dragged = false;
      suppressClick = false;
      startX = e.clientX;
      lastX = e.clientX;
      velocity = 0;
      const rect = runway.getBoundingClientRect();
      runwayTop = rect.top + window.scrollY;
      maxScrollY = runwayTop + Math.max(0, rect.height - window.innerHeight);
      // 若尚未完全吸顶，从当前位置起步；若在跑道内则直接跟随
      startScrollY = Math.min(maxScrollY, Math.max(runwayTop, window.scrollY));
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 5) {
        dragged = true;
        suppressClick = true;
        getTrack()?.setAttribute("data-dragging", "true");
        // 避免拖拽过程中误选中文本
        window.getSelection()?.removeAllRanges();
      }
      if (!dragged) return;

      velocity = lastX - e.clientX;
      lastX = e.clientX;

      const nextTop = Math.min(
        maxScrollY,
        Math.max(runwayTop, startScrollY - dx * 1.15),
      );
      window.scrollTo({ top: nextTop, behavior: "instant" });
    };

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      if (dragged) {
        getTrack()?.removeAttribute("data-dragging");
        dragged = false;
        window.setTimeout(() => {
          suppressClick = false;
        }, 80);

        // 松手带一点轻柔惯性滑行，严格钳制在本卷范围内
        if (Math.abs(velocity) > 1.5) {
          const coastTop = Math.min(
            maxScrollY,
            Math.max(runwayTop, window.scrollY + velocity * 10),
          );
          window.scrollTo({ top: coastTop, behavior: "smooth" });
        }
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: DragEvent) => {
      // 禁用浏览器原生链接拖拽幽灵图，让信笺任意位置皆可顺手拖动
      e.preventDefault();
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("click", onClickCapture, true);
    viewport.addEventListener("dragstart", onDragStart);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      getTrack()?.removeAttribute("data-dragging");
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("click", onClickCapture, true);
      viewport.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [volumeLetters.length, safeVolume, runwayHeight]);

  const answeredCount = useMemo(
    () => initialLetters.filter((l) => Boolean(l.answer)).length,
    [initialLetters],
  );
  const waitingCount = useMemo(
    () => initialLetters.filter((l) => !l.answer).length + mine.length,
    [initialLetters, mine],
  );
  const totalCount = initialLetters.length + mine.length;

  const currentLetter = volumeLetters[activeIndex];
  const currentNum = currentLetter
    ? (letterNumberMap.get(currentLetter.id) ?? 0)
    : 0;

  return (
    <div
      ref={runwayRef}
      style={runwayHeight ? { height: `${runwayHeight}px` } : undefined}
      className="relative"
    >
      {/* 吸顶画卷展台：滚到此区域时稳稳驻留，纵滚即展卷，卷毕自动放行至页脚 */}
      <div className="sticky top-0 flex min-h-dvh flex-col justify-center py-8 md:py-10">
        {/* 顶部题头 + 筛选与寻笺栏 */}
        <div className="mx-auto w-full max-w-[1180px] px-6 md:px-10">
          <div className="flex flex-col gap-4 border-b border-rule/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-song text-[26px] tracking-[0.08em] text-ink md:text-[30px]">
                    来鸿
                  </h2>
                  <span className="font-kai text-[13px] tracking-[0.2em] text-seal">
                    第{toCnVolume(safeVolume + 1)}卷
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint">
                    / 共{totalVolumes}卷
                  </span>
                </div>
                <p className="mt-1 font-kai text-[12.5px] text-ink-faint">
                  随风而散者，不可胜数；落于纸上者，皆可细读。
                </p>
              </div>
              <div className="hidden pb-0.5 sm:block">
                <PostageStamp theme="lantern" color="seal" price="80" size="sm" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-xs px-3 py-1.5 font-hei text-[11.5px] tracking-wider transition-all duration-300 ${
                    filter === "all"
                      ? "bg-seal/10 font-medium text-seal shadow-2xs"
                      : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
                  }`}
                >
                  全部 ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("answered")}
                  className={`rounded-xs px-3 py-1.5 font-hei text-[11.5px] tracking-wider transition-all duration-300 ${
                    filter === "answered"
                      ? "bg-seal/10 font-medium text-seal shadow-2xs"
                      : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
                  }`}
                >
                  已复 ({answeredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("waiting")}
                  className={`rounded-xs px-3 py-1.5 font-hei text-[11.5px] tracking-wider transition-all duration-300 ${
                    filter === "waiting"
                      ? "bg-seal/10 font-medium text-seal shadow-2xs"
                      : "text-ink-faint hover:bg-paper-deep/30 hover:text-ink"
                  }`}
                >
                  候复 ({waitingCount})
                </button>
              </div>

              <div className="relative w-44 sm:w-52">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="寻笺，或寻名字…"
                  className="w-full border-b border-rule bg-transparent py-1 pl-5 pr-5 font-kai text-[12px] text-ink outline-none transition-colors placeholder:text-ink-faint/50 focus:border-seal/70"
                />
                <Search className="pointer-events-none absolute left-0 top-1.5 h-3.5 w-3.5 text-ink-faint/60" />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword("")}
                    className="absolute right-0 top-1 font-mono text-[13px] text-ink-faint hover:text-seal"
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
                className="flex items-center gap-1.5 whitespace-nowrap border border-seal/40 bg-seal/[0.04] px-3 py-1.5 font-hei text-[11px] tracking-wider text-seal shadow-2xs transition-all duration-300 hover:scale-102 hover:bg-seal/[0.1] active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                <span>随手一拈</span>
              </button>
            </div>
          </div>
        </div>

        {/* 画卷主体 */}
        {volumeLetters.length === 0 ? (
          <div className="mx-auto mt-8 w-full max-w-[1180px] px-6 md:px-10">
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
          <div className="mt-4">
            {/* 从页面中央向两侧展开的画卷视口 */}
            <div
              ref={viewportRef}
              className="handscroll-viewport"
              data-unrolled={unrolled ? "true" : "false"}
            >
              <div className="handscroll-track">
                {/* 整幅物理画卷：[上一卷] [左画轴] [宣纸画心(含间距)] [右画轴] [下一卷] */}
                <div ref={sheetRef} className="handscroll-sheet">
                  {/* 左画轴外侧：上一卷 */}
                  <div className="handscroll-vol handscroll-vol--prev">
                    {safeVolume > 0 ? (
                      <button
                        type="button"
                        onClick={() => switchVolume(safeVolume - 1)}
                        className="group flex flex-col items-center gap-2.5 border border-rule/80 bg-paper-soft/85 px-3 py-5 text-ink-soft shadow-xs transition-all duration-300 hover:border-seal/60 hover:text-seal"
                      >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span
                          className="font-song text-[14px] tracking-[0.3em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          上一卷
                        </span>
                        <span className="font-mono text-[10px] text-ink-faint">
                          第{toCnVolume(safeVolume)}卷
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 border border-dashed border-rule/60 px-3 py-5 text-ink-faint/70">
                        <span
                          className="font-kai text-[12.5px] tracking-[0.28em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          初卷伊始
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 左紫檀画轴 */}
                  <div className="handscroll-roller" aria-hidden="true" />

                  {/* 连续绫裱宣纸画心（信件与画卷上下及左右均有舒朗间距） */}
                  <div className="handscroll-paper">
                    {/* 卷首引首 */}
                    <aside
                      className="handscroll-endpiece"
                      aria-label="卷首引首"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="font-song text-[21px] tracking-[0.28em] text-ink"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          第{toCnVolume(safeVolume + 1)}卷
                        </span>
                        <span
                          className="mt-1.5 font-kai text-[12px] tracking-[0.2em] text-ink-faint"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          尺素来鸿 · 本卷 {volumeLetters.length} 通
                        </span>
                      </div>
                      <Seal text="展卷" size="2rem" tilt={-3} />
                    </aside>

                    {/* 本卷诸封来信（每张独立宣纸信笺，上下左右留白） */}
                    {volumeLetters.map((q, i) => (
                      <div
                        key={q.id}
                        ref={(el) => {
                          cardRefs.current[i] = el;
                        }}
                        className="handscroll-card"
                      >
                        <Letter
                          q={q}
                          number={letterNumberMap.get(q.id) ?? 0}
                          index={i}
                          active={i === activeIndex}
                        />
                      </div>
                    ))}

                    {/* 卷尾题跋 */}
                    <aside
                      className="handscroll-endpiece"
                      aria-label="卷尾题跋"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="font-song text-[19px] tracking-[0.26em] text-ink"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          纸短情长
                        </span>
                        <span
                          className="mt-1.5 font-kai text-[12px] tracking-[0.2em] text-ink-faint"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          第{toCnVolume(safeVolume + 1)}卷毕
                        </span>
                      </div>
                      <Seal text="尺素" size="2rem" tilt={2} />
                    </aside>
                  </div>

                  {/* 右紫檀画轴 */}
                  <div className="handscroll-roller" aria-hidden="true" />

                  {/* 右画轴外侧：下一卷 */}
                  <div className="handscroll-vol handscroll-vol--next">
                    {safeVolume < totalVolumes - 1 ? (
                      <button
                        type="button"
                        onClick={() => switchVolume(safeVolume + 1)}
                        className="group flex flex-col items-center gap-2.5 border border-seal/45 bg-paper-soft/90 px-3 py-5 text-seal shadow-xs transition-all duration-300 hover:border-seal hover:bg-seal/[0.06]"
                      >
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        <span
                          className="font-song text-[14px] tracking-[0.3em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          下一卷
                        </span>
                        <span className="font-mono text-[10px] text-ink-faint">
                          第{toCnVolume(safeVolume + 2)}卷
                        </span>
                      </button>
                    ) : totalVolumes > 1 ? (
                      <button
                        type="button"
                        onClick={() => switchVolume(0)}
                        className="group flex flex-col items-center gap-2.5 border border-rule/80 bg-paper-soft/80 px-3 py-5 text-ink-faint transition-colors hover:border-seal/55 hover:text-seal"
                      >
                        <span
                          className="font-kai text-[13px] tracking-[0.28em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          归至初卷
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 border border-dashed border-rule/60 px-3 py-5 text-ink-faint/70">
                        <span
                          className="font-kai text-[12.5px] tracking-[0.28em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          全卷已毕
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部卷轴刻度与分卷指引 */}
            <div className="mx-auto mt-4 w-full max-w-[1180px] px-6 md:px-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 font-mono text-[11.5px] tracking-[0.16em] text-ink-faint">
                  <span>
                    <strong className="font-medium text-seal">
                      {String(activeIndex + 1).padStart(2, "0")}
                    </strong>{" "}
                    / {String(volumeLetters.length).padStart(2, "0")}
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

                {/* 本卷可点击跳转刻度 */}
                <div
                  role="tablist"
                  aria-label="本卷刻度"
                  className="flex items-center justify-center gap-2"
                >
                  {volumeLetters.map((q, i) => {
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
                        onClick={() => scrollToCard(i)}
                        className="group flex h-5 items-center justify-center px-0.5"
                      >
                        <span
                          className={`block rounded-full transition-all duration-300 ${
                            isCurrent
                              ? "h-3.5 w-[3px] bg-seal"
                              : "h-2 w-[2px] bg-rule group-hover:h-3 group-hover:bg-seal/60"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="hidden font-hei text-[11px] tracking-[0.16em] text-ink-faint/80 md:block">
                  滚轮 · 鼠标拖拽 · ← → 展卷
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 偶遇随机弹窗 */}
      <RandomLetterModal
        letters={initialLetters}
        isOpen={randomModalOpen}
        onClose={() => setRandomModalOpen(false)}
      />
    </div>
  );
}
