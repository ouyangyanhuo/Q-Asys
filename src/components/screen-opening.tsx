"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Seal } from "./stamp-badge";

type Phase = "closed" | "opening" | "gone";
type Side = "l" | "r";

/** 至少显示加载一秒：让画心与加载过程舒缓呈现，不闪烁 */
const MIN_SHOW_MS = 1000;
/** 迟迟等不到 load 也得开，别让开屏成了门闩 */
const MAX_WAIT_MS = 2500;
/** 印章盖下后在纸上静置留白的时间：盖上去以后等一小段时间再开屏 */
const STAMP_HOLD_MS = 1000;
/** 一扇扇错峰折屏与退场走完再摘节点 */
const OPEN_MS = 1380;
/** 减弱动态时只留一次淡出 */
const STILL_MS = 420;

/** 每翼四扇，合起来八曲 */
const PER_WING = 4;
/** 立着时的折角，相对上一扇；一正一反才是屏风 */
const TILT = [0, 1.8, -3.6, 3.6];
/** 收拢时的风琴折角，一正一反依次咬合折叠 */
const FOLD = [0, 80, -160, 160];

/** 一次整页加载只开一回；客户端转场回到首页不再拦人 */
let played = false;

export function ScreenOpening() {
  const [phase, setPhase] = useState<Phase>(() => {
    if (played) return "gone";
    // 客户端转场进来时页面上还没有这层屏风；只有首屏的 SSR 才带着它
    if (
      typeof document !== "undefined" &&
      !document.querySelector("[data-screen-root]")
    ) {
      played = true;
      return "gone";
    }
    return "closed";
  });

  // 加载就绪后，印章盖下（覆盖加载动画）
  const [stamped, setStamped] = useState(false);

  const actionRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (played) return;

    const doc = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = reduce.matches;
    const startedAt = performance.now();

    let ready = false;
    let stampedLocal = false;
    let opening = false;
    let openTimer = 0;
    let stampTimer = 0;
    let endTimer = 0;
    let maxTimer = 0;

    // 只锁内容、不锁滚动条：滚动条一直在，视口宽度不变，背后那层纸才不会横移
    const lock = () => doc.setAttribute("data-screen", "on");
    const unlock = () => doc.removeAttribute("data-screen");

    const doOpen = () => {
      if (opening) return;
      opening = true;
      played = true;
      window.clearTimeout(openTimer);
      window.clearTimeout(stampTimer);
      window.clearTimeout(maxTimer);
      doc.setAttribute("data-screen", "opening");
      setPhase("opening");
      endTimer = window.setTimeout(() => {
        unlock();
        setPhase("gone");
      }, still ? STILL_MS : OPEN_MS);
    };

    const doStamp = () => {
      if (stampedLocal || opening) return;
      stampedLocal = true;
      setStamped(true);
      // 盖章后稳稳驻留 420ms，让用户看清印章落纸，再行开屏
      openTimer = window.setTimeout(doOpen, still ? 160 : STAMP_HOLD_MS);
    };

    const maybeStamp = () => {
      if (!ready || stampedLocal || opening) return;
      const elapsed = performance.now() - startedAt;
      const left = MIN_SHOW_MS - elapsed;
      if (left > 0) {
        stampTimer = window.setTimeout(doStamp, left);
      } else {
        doStamp();
      }
    };

    const markReady = () => {
      if (ready) return;
      ready = true;
      maybeStamp();
    };

    // 用户主动点击或按键：若未盖印则立即盖印并随之开屏；若已盖印则直接开屏
    const handleAction = () => {
      if (!stampedLocal) {
        window.clearTimeout(stampTimer);
        doStamp();
      } else if (!opening) {
        window.clearTimeout(openTimer);
        doOpen();
      }
    };
    actionRef.current = handleAction;

    maxTimer = window.setTimeout(markReady, MAX_WAIT_MS);

    const onLoad = () => {
      // 字体还没到就拉开，屏风上的字会在开屏途中跳一下；等一等，但不久等
      const fonts = document.fonts;
      if (!fonts || fonts.status === "loaded") {
        markReady();
        return;
      }
      fonts.ready.then(markReady).catch(markReady);
      window.setTimeout(markReady, 700);
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    lock();

    // 点击或按键可直接开屏，不必干等
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        handleAction();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(stampTimer);
      window.clearTimeout(endTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      data-screen-root=""
      className="screen-open"
      data-phase={phase}
      aria-hidden="true"
      onClick={() => actionRef.current()}
    >
      {/* 画心是整屏第一眼要看的东西，别等 CSS 慢慢发现它 */}
      <link rel="preload" as="image" href="/screen/byobu.jpg" fetchPriority="high" />
      <span className="so-glow" />
      <div className="screen-open__stage">
        <Wing side="l" />
        <Wing side="r" />
      </div>

      <div className="so-label">
        <span className="so-title">尺素</span>
        <span className="so-sub">不必具名</span>

        {/* 印章/加载槽位：先显加载，就绪后以“启”字朱印覆之 */}
        <div className="so-slot">
          <div
            className={`so-load ${stamped ? "so-load--covered" : ""}`}
            aria-label="展卷中"
          >
            <div className="so-spinner" aria-hidden="true">
              <span className="so-spinner__dot" />
            </div>
            <div className="so-track">
              <span className="so-fill" />
            </div>
            <span className="so-load-text">展卷中</span>
          </div>

          {stamped && (
            <span className="so-stamp-wrap stamp-press">
              <Seal text="启" size="2.25rem" tilt={-3} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 一翼四扇，扇扇相衔：子扇长在父扇的铰链上，父扇一转，后面的都跟着走。
 * 画心在 CSS 里（八扇共裁一张公版屏风图）。
 */
function Wing({ side }: { side: Side }) {
  // 右翼自右向左编号，画心的切片号正好倒过来
  const slices = side === "l" ? [0, 1, 2, 3] : [7, 6, 5, 4];
  return (
    <div className={`so-wing so-wing--${side}`}>
      <Leaf side={side} slices={slices} index={0} />
    </div>
  );
}

function Leaf({
  side,
  slices,
  index,
}: {
  side: Side;
  slices: number[];
  index: number;
}) {
  const last = index === slices.length - 1;
  return (
    <div
      className="so-leaf"
      data-root={index === 0 ? "" : undefined}
      data-last={last ? "" : undefined}
      style={
        {
          // 八扇的切片；窄屏改六扇后按 --slicen 重新裁
          "--slice": slices[index],
          "--slicen": side === "l" ? index : 5 - index,
          "--i": index,
          "--rel": `${TILT[index]}deg`,
          "--fold": `${FOLD[index]}deg`,
        } as CSSProperties
      }
    >
      <div className="so-panel">
        <div className="so-face">
          <span className="so-art" />
        </div>
        <span className="so-frame" />
        <span className="so-verso" />
      </div>
      {!last && <Leaf side={side} slices={slices} index={index + 1} />}
    </div>
  );
}
