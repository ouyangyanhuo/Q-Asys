"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Seal } from "./stamp-badge";

type Phase = "closed" | "opening" | "gone";
type Side = "l" | "r";

/** 至少亮满一秒：再快也让屏风停一口气，不然只是闪了一下 */
const MIN_SHOW_MS = 1200;
/** 迟迟等不到 load 也得开，别让开屏成了门闩 */
const MAX_WAIT_MS = 2400;
/** 折屏（含错峰）与退场都走完再摘节点 */
const OPEN_MS = 1500;
/** 减弱动态时只留一次淡出 */
const STILL_MS = 420;

/** 每翼四扇，合起来八曲 */
const PER_WING = 4;
/** 立着时的折角，相对上一扇；一正一反才是屏风 */
const TILT = [0, 1.8, -3.6, 3.6];

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

  useEffect(() => {
    if (played) return;

    const doc = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = reduce.matches;
    const startedAt = performance.now();

    let ready = false;
    let opening = false;
    let openTimer = 0;
    let endTimer = 0;
    let maxTimer = 0;

    // 只锁内容、不锁滚动条：滚动条一直在，视口宽度不变，背后那层纸才不会横移
    const lock = () => doc.setAttribute("data-screen", "on");
    const unlock = () => doc.removeAttribute("data-screen");

    const open = () => {
      if (opening) return;
      opening = true;
      played = true;
      window.clearTimeout(openTimer);
      window.clearTimeout(maxTimer);
      setPhase("opening");
      endTimer = window.setTimeout(() => {
        unlock();
        setPhase("gone");
      }, still ? STILL_MS : OPEN_MS);
    };

    const maybeOpen = () => {
      if (!ready || opening) return;
      const left = MIN_SHOW_MS - (performance.now() - startedAt);
      if (left > 0) openTimer = window.setTimeout(open, left);
      else open();
    };

    const markReady = () => {
      if (ready) return;
      ready = true;
      maybeOpen();
    };

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

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(endTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("load", onLoad);
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
        <span className="so-sub">不署名的来信</span>
        {/* 钤印：落到纸上的那一下，是开屏前唯一的动静 */}
        <span
          className="stamp-press"
          style={{ "--d": "320ms" } as CSSProperties}
        >
          <Seal text="启" size="1.8rem" tilt={-3} />
        </span>
        <span className="so-track">
          <span className="so-fill" />
        </span>
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
      <Leaf slices={slices} index={0} />
    </div>
  );
}

function Leaf({ slices, index }: { slices: number[]; index: number }) {
  const last = index === slices.length - 1;
  return (
    <div
      className="so-leaf"
      data-root={index === 0 ? "" : undefined}
      style={
        {
          "--slice": slices[index],
          "--i": index,
          "--rel": `${TILT[index]}deg`,
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
      {!last && <Leaf slices={slices} index={index + 1} />}
    </div>
  );
}
