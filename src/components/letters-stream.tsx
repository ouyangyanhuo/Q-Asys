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
/** 解开丝线、左右扯开并徐徐展开画卷所占的纵向滚动距离（px） */
const UNROLL_PX = 560;

const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
function toCnVolume(n: number): string {
  if (n <= 10) return CN_NUM[n] ?? String(n);
  if (n < 20) return `十${CN_NUM[n - 10] ?? ""}`;
  return String(n);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function ScrollRoller({ side }: { side: "left" | "right" }) {
  const shaft = (
    <div className="scroll-roller__shaft">
      <span className="scroll-roller__finial scroll-roller__finial--top" />
      <span className="scroll-roller__band scroll-roller__band--top" />
      <span className="scroll-roller__band scroll-roller__band--bottom" />
      <span className="scroll-roller__finial scroll-roller__finial--bottom" />
    </div>
  );
  const wrap = <div className="scroll-roller__wrap" />;

  return (
    <div
      className={`scroll-roller scroll-roller--${side}`}
      aria-hidden="true"
    >
      {side === "left" ? (
        <>
          {shaft}
          {wrap}
        </>
      ) : (
        <>
          {wrap}
          {shaft}
        </>
      )}
    </div>
  );
}

type CeremonyPhase = "idle" | "closing" | "placing";

export function LettersStream({ initialLetters, total }: LettersStreamProps) {
  const [filter, setFilter] = useState<"all" | "answered" | "waiting">("all");
  const [keyword, setKeyword] = useState("");
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [volume, setVolume] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [phase, setPhase] = useState<CeremonyPhase>("idle");
  const [runwayHeight, setRunwayHeight] = useState<number | null>(null);

  // 自己投出、尚未过审的那几封。服务端读 cookie 会把整页变成动态渲染，
  // 所以改为挂载后单独取一次，只为本人钉在初卷最前端。
  const [mine, setMine] = useState<Question[]>([]);

  const runwayRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closedWrapRef = useRef<HTMLDivElement | null>(null);
  const knotRef = useRef<SVGSVGElement | null>(null);
  const leftCordRef = useRef<SVGSVGElement | null>(null);
  const rightCordRef = useRef<SVGSVGElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const panOverflowRef = useRef(0);
  const inViewRef = useRef(false);
  const hasArrivedRef = useRef(false);
  const isOpenedRef = useRef(false);
  const switchTimersRef = useRef<number[]>([]);

  // rAF 平滑阻尼驱动总进度（0 ~ UNROLL_PX 为解绦展卷，UNROLL_PX ~ 总长 为横移画卷）
  const targetPxRef = useRef(0);
  const currentPxRef = useRef(0);
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
    const stage = stageRef.current;
    let mineIo: IntersectionObserver | null = null;
    let viewIo: IntersectionObserver | null = null;

    if (runway && stage && "IntersectionObserver" in window) {
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

      // 首次滑到卷轴展台时，触发一次「斜放新卷上案」的落案动画
      viewIo = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          inViewRef.current = visible;
          if (visible && !hasArrivedRef.current) {
            hasArrivedRef.current = true;
            setPhase("placing");
            const t = window.setTimeout(() => setPhase("idle"), 920);
            switchTimersRef.current.push(t);
          }
        },
        { threshold: 0.2 },
      );
      viewIo.observe(stage);
    } else {
      load();
    }

    window.addEventListener("qasys-mine-refresh", load);

    return () => {
      alive = false;
      mineIo?.disconnect();
      viewIo?.disconnect();
      window.removeEventListener("qasys-mine-refresh", load);
      switchTimersRef.current.forEach((id) => window.clearTimeout(id));
      switchTimersRef.current = [];
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

  // 切换画卷仪式：旧卷收拢离案（680ms） -> 换上新卷回到卷首 -> 斜放落案（900ms）
  const switchVolume = useCallback(
    (nextVolume: number) => {
      if (phase !== "idle") return;
      switchTimersRef.current.forEach((id) => window.clearTimeout(id));
      switchTimersRef.current = [];

      setPhase("closing");

      const t1 = window.setTimeout(() => {
        setVolume(nextVolume);
        setActiveIndex(0);
        setIsOpened(false);
        isOpenedRef.current = false;
        targetPxRef.current = 0;
        currentPxRef.current = 0;

        const runway = runwayRef.current;
        if (runway) {
          const top = runway.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top, behavior: "instant" });
        }

        setPhase("placing");
        const t2 = window.setTimeout(() => {
          setPhase("idle");
        }, 920);
        switchTimersRef.current.push(t2);
      }, 680);

      switchTimersRef.current.push(t1);
    },
    [phase],
  );

  // 点击未打开的斜置卷轴时，自动平滑滚过解绦段将其展开
  const autoUnroll = useCallback(() => {
    const runway = runwayRef.current;
    if (!runway) return;
    const runwayTop = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: runwayTop + UNROLL_PX, behavior: "smooth" });
  }, []);

  // 测量本卷横向总溢出宽度，跑道总长 = 100vh + 解绦展卷段(UNROLL_PX) + 横向画卷溢出宽
  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const sheet = sheetRef.current;
      if (!viewport || !sheet || volumeLetters.length === 0) {
        panOverflowRef.current = 0;
        setRunwayHeight(null);
        return;
      }

      const overflow = Math.max(0, sheet.scrollWidth - viewport.clientWidth);
      panOverflowRef.current = overflow;
      setRunwayHeight(Math.round(window.innerHeight + UNROLL_PX + overflow));
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

  // 统一物理帧更新：将 currentPx 映射为「斜卷扶正 -> 丝结拆开 -> 丝线左右扯开 -> 画卷中开 -> 横向展读」
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const applyVisuals = (px: number) => {
      const viewport = viewportRef.current;
      const sheet = sheetRef.current;
      const closedWrap = closedWrapRef.current;
      const knot = knotRef.current;
      const leftCord = leftCordRef.current;
      const rightCord = rightCordRef.current;
      if (!viewport || !sheet) return;

      const u = reduceMotion ? 1 : clamp01(px / UNROLL_PX);
      const panX = Math.min(panOverflowRef.current, Math.max(0, px - UNROLL_PX));

      // 1. 卷轴倾斜扶正：初落案头 -11deg，滚动前 35% 扶正至 0deg
      const straighten = smoothstep(0, 0.36, u);
      const tiltDeg = -11 * (1 - straighten);

      // 2. 丝结解开（0.02 -> 0.32）
      const knotOpen = smoothstep(0.02, 0.32, u);
      if (knot) {
        const knotScale = 1 + knotOpen * 0.45;
        const knotOpacity = 1 - knotOpen;
        knot.style.opacity = knotOpacity.toFixed(3);
        knot.style.transform = `rotate(${tiltDeg.toFixed(2)}deg) scale(${knotScale.toFixed(3)})`;
      }

      // 3. 左右朱砂丝线从卷筒处拆开，分别向左与向右伸展扯开并淡出（0.04 -> 0.88）
      const pull = smoothstep(0.04, 0.82, u);
      const pullFade = 1 - smoothstep(0.58, 0.92, u);
      const pullVw = pull * 36;
      const cordScaleX = 0.16 + pull * 0.94;
      if (leftCord) {
        leftCord.style.opacity = pullFade.toFixed(3);
        leftCord.style.transform = `translate3d(${(-pullVw).toFixed(2)}vw, -50%, 0) rotate(${(tiltDeg * 0.75).toFixed(2)}deg) scaleX(${cordScaleX.toFixed(3)})`;
      }
      if (rightCord) {
        rightCord.style.opacity = pullFade.toFixed(3);
        rightCord.style.transform = `translate3d(${pullVw.toFixed(2)}vw, -50%, 0) rotate(${(tiltDeg * 0.75).toFixed(2)}deg) scaleX(${cordScaleX.toFixed(3)})`;
      }

      // 4. 未展开的斜置卷轴随丝线拉开而渐渐交棒给真正展开的画卷（0.22 -> 0.46）
      const bundleFade = 1 - smoothstep(0.22, 0.46, u);
      if (closedWrap) {
        closedWrap.style.opacity = bundleFade.toFixed(3);
        closedWrap.style.transform = `rotate(${tiltDeg.toFixed(2)}deg) scale(${(1 + (1 - bundleFade) * 0.04).toFixed(3)})`;
      }

      // 5. 真正的画卷紧随左右丝线从正中央徐徐向两侧铺开（0.24 -> 1.0）
      const openT = smoothstep(0.24, 1.0, u);
      const insetPct = (1 - openT) * 48;
      const vpOpacity = smoothstep(0.2, 0.44, u);
      viewport.style.clipPath = `inset(0 ${insetPct.toFixed(2)}% 0 ${insetPct.toFixed(2)}%)`;
      viewport.style.opacity = vpOpacity.toFixed(3);
      viewport.style.transform =
        Math.abs(tiltDeg) > 0.05 ? `rotate(${(tiltDeg * 0.4).toFixed(2)}deg)` : "";

      // 6. 横向平移画卷（左轴头逐渐移出屏幕左侧，直到右轴头与「下一卷」露出）
      sheet.style.transform = `translate3d(${-panX.toFixed(1)}px, 0, 0)`;

      const nowOpened = u > 0.45;
      if (nowOpened !== isOpenedRef.current) {
        isOpenedRef.current = nowOpened;
        setIsOpened(nowOpened);
      }

      // 7. 实时计算最居中的信笺索引
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
      const diff = targetPxRef.current - currentPxRef.current;
      if (Math.abs(diff) < 0.4) {
        currentPxRef.current = targetPxRef.current;
        applyVisuals(currentPxRef.current);
        rafRef.current = 0;
        return;
      }
      currentPxRef.current += diff * 0.14;
      applyVisuals(currentPxRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const runway = runwayRef.current;
      if (!runway) return;
      const totalSpan = UNROLL_PX + panOverflowRef.current;
      const rect = runway.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp01(-rect.top / scrollable);
      targetPxRef.current = progress * totalSpan;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    applyVisuals(currentPxRef.current);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      window.removeEventListener("scroll", onScroll);
    };
  }, [volumeLetters.length, runwayHeight, safeVolume]);

  // 点击刻度尺或方向键时，平滑滚到对应的页面纵滚位置（若未展开会自动一并展开）
  const scrollToCard = useCallback((idx: number) => {
    const runway = runwayRef.current;
    const viewport = viewportRef.current;
    const card = cardRefs.current[idx];
    const overflow = panOverflowRef.current;
    if (!runway || !viewport || !card) return;

    const currentPan = Math.max(0, currentPxRef.current - UNROLL_PX);
    const vpRect = viewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardLeftUnshifted = cardRect.left - vpRect.left + currentPan;
    const desiredPan = Math.min(
      overflow,
      Math.max(0, cardLeftUnshifted - (vpRect.width - cardRect.width) / 2),
    );
    const runwayTop = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: runwayTop + UNROLL_PX + desiredPan,
      behavior: "smooth",
    });
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

  // 鼠标拖拽画卷：与页面纵滚跑道 1:1 联动（包含解绦展卷 + 水平平移全过程）
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
      startScrollY = Math.min(maxScrollY, Math.max(runwayTop, window.scrollY));
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 5) {
        dragged = true;
        suppressClick = true;
        getTrack()?.setAttribute("data-dragging", "true");
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
      {/* 吸顶画卷展台：先斜置未开之卷，滚轮解绦展卷，卷毕续览页脚 */}
      <div
        ref={stageRef}
        className="sticky top-0 flex min-h-dvh flex-col justify-center py-4 md:py-6"
      >
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
          <div className="mt-3">
            {/* 画卷仪式容器：承载「斜放落案」「卷收离案」「丝绦拆解」「展卷横移」 */}
            <div className="handscroll-ceremony" data-phase={phase}>
              {/* 1. 未打开的斜置卷轴（卷首落案态，点击或向下滚动即可解绦展开） */}
              <div
                ref={closedWrapRef}
                className="closed-scroll-wrap"
                data-open={isOpened ? "true" : "false"}
              >
                <button
                  type="button"
                  onClick={autoUnroll}
                  aria-label={`展开第${toCnVolume(safeVolume + 1)}卷`}
                  className="closed-scroll-bundle border-0 bg-transparent p-0 text-left"
                >
                  <ScrollRoller side="left" />
                  <div className="closed-scroll-body">
                    <div className="closed-scroll-tag">
                      <span
                        className="font-song text-[18px] tracking-[0.26em] text-ink"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        尺素来鸿
                      </span>
                      <span
                        className="font-kai text-[11.5px] tracking-[0.22em] text-seal"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        第{toCnVolume(safeVolume + 1)}卷
                      </span>
                    </div>
                  </div>
                  <ScrollRoller side="right" />
                </button>

                <p className="mt-7 font-kai text-[12.5px] tracking-[0.22em] text-ink-faint">
                  向下滚动或轻点卷轴 · 解绦展卷
                </p>
              </div>

              {/* 2. 朱砂丝绦与中央活结：滚轮滚动时拆开丝结，丝线分别向左、向右扯开 */}
              <div className="silk-rig" aria-hidden="true">
                {/* 左侧丝线与丝穗（向左扯出） */}
                <svg
                  ref={leftCordRef}
                  className="silk-cord silk-cord--left"
                  viewBox="0 0 520 110"
                  fill="none"
                >
                  <path
                    d="M520 55 C 445 55, 388 47, 305 56 C 228 64, 152 46, 62 58 C 36 61, 18 66, 4 74"
                    stroke="#a63226"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M520 54 C 445 54, 388 46, 305 55 C 228 63, 152 45, 62 57"
                    stroke="#dd6b5b"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  {/* 左端丝穗 */}
                  <circle cx="42" cy="60" r="3.8" fill="#c99d58" />
                  <path
                    d="M39 62 C 26 70, 14 78, 2 84 M40 63 C 28 74, 18 84, 8 92 M42 64 C 33 76, 25 87, 17 96"
                    stroke="#b23a2c"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>

                {/* 中央朱砂活结 */}
                <svg
                  ref={knotRef}
                  className="silk-knot"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <path
                    d="M14 24 C 8 15, 20 8, 24 19 C 28 8, 40 15, 34 24 C 40 33, 28 40, 24 29 C 20 40, 8 33, 14 24 Z"
                    stroke="#a63226"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                    fill="#b83a2c"
                    fillOpacity="0.18"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="4.2"
                    fill="#b23a2c"
                    stroke="#e3c083"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* 右侧丝线与丝穗（向右扯出） */}
                <svg
                  ref={rightCordRef}
                  className="silk-cord silk-cord--right"
                  viewBox="0 0 520 110"
                  fill="none"
                >
                  <path
                    d="M0 55 C 75 55, 132 63, 215 54 C 292 46, 368 64, 458 52 C 484 49, 502 44, 516 36"
                    stroke="#a63226"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 54 C 75 54, 132 62, 215 53 C 292 45, 368 63, 458 51"
                    stroke="#dd6b5b"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  {/* 右端丝穗 */}
                  <circle cx="478" cy="50" r="3.8" fill="#c99d58" />
                  <path
                    d="M481 48 C 494 40, 506 32, 518 26 M480 47 C 492 36, 502 26, 512 18 M478 46 C 487 34, 495 23, 503 14"
                    stroke="#b23a2c"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* 3. 真正展开后的实体画卷视口 */}
              <div ref={viewportRef} className="handscroll-viewport">
                <div className="handscroll-track">
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

                    {/* 左精雕紫檀玉轴 */}
                    <ScrollRoller side="left" />

                    {/* 连续绫裱宣纸画心（每封信 470px 定高、加宽横幅、四周留白） */}
                    <div className="handscroll-paper">
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

                    {/* 右精雕紫檀玉轴 */}
                    <ScrollRoller side="right" />

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
            </div>

            {/* 底部卷轴刻度与分卷指引 */}
            <div className="mx-auto mt-3 w-full max-w-[1180px] px-6 md:px-10">
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
                  滚轮解绦展卷 · 拖拽 · ← → 漫游
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
