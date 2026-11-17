"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Seal } from "./stamp-badge";

type Phase = "closed" | "opening" | "gone";

/** 至少亮满一秒：再快也让屏风停一口气，不然只是闪了一下 */
const MIN_SHOW_MS = 1200;
/** 迟迟等不到 load 也得开，别让开屏成了门闩 */
const MAX_WAIT_MS = 2400;
/** 折屏动画走完（含错峰）再摘掉节点 */
const OPEN_MS = 1200;
/** 减弱动态时只留一次淡出 */
const STILL_MS = 420;

/** 每次整页加载只开一回；客户端转场回到首页不再拦人 */
let played = false;

const PER_WING = 3;
/** 六扇：左翼自左而右，右翼自右而左，中缝落在第三、四扇之间 */
const SLICES = { l: [0, 1, 2], r: [5, 4, 3] } as const;

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

    // 锁滚动时把滚动条让出的那一条补回去，免得开屏一撤整页横跳
    const lock = () => {
      const gutter = window.innerWidth - doc.clientWidth;
      if (gutter > 0) doc.style.setProperty("--so-gutter", `${gutter}px`);
      doc.setAttribute("data-screen", "on");
    };
    const unlock = () => {
      doc.removeAttribute("data-screen");
      doc.style.removeProperty("--so-gutter");
    };

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

/** 一翼三扇。每扇自带一片画心，裁的正是整幅山水里自己那一竖条 */
function Wing({ side }: { side: "l" | "r" }) {
  const slices = SLICES[side];
  return (
    <div className={`so-wing so-wing--${side}`}>
      {slices.map((slice, i) => (
        <div
          key={slice}
          className="so-leaf"
          style={
            {
              "--i": i,
              "--slice": slice,
              // 离中缝越近越早折，屏风是从中间合上的
              "--depth": PER_WING - 1 - i,
            } as CSSProperties
          }
        >
          <div className="so-fold">
            <div className="so-face">
              <div className="so-art">
                <ScreenPainting uid={`${side}${slice}`} />
              </div>
            </div>
            <span className="so-frame" />
            {i > 0 && (
              <>
                <span className="so-hinge so-hinge--t" />
                <span className="so-hinge so-hinge--b" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 一幅水墨：远山、主峰、孤舟、松与竹，横竖都要能看。
 * 窄屏时 preserveAspectRatio 只取中间一段，故中央另有一重淡峰，
 * 山形不至被裁空。六扇各画自己那一条，凑起来是同一条山脉。
 */

/* 山脊线单独留一份：填色用闭口，勒边用开口，一笔两用 */
const RIDGE_FAR =
  "M-60 512C40 500 106 462 172 422C226 390 272 326 322 298C362 276 396 296 430 338C466 382 512 400 572 412C648 426 700 410 764 428C834 448 892 420 958 404C1020 388 1062 334 1120 312C1178 290 1228 324 1272 364C1320 408 1384 428 1450 436C1512 444 1570 434 1640 420";
const RIDGE_CENTER =
  "M596 720C642 660 686 588 726 534C752 500 774 470 800 456C828 442 852 472 876 508C908 556 952 614 1002 668C1030 698 1058 720 1088 732";
const RIDGE_MAIN =
  "M28 716L96 636L132 666L168 596L208 626L252 496L288 532L326 436L362 476L402 312L438 388L470 462L512 504L552 566L596 642L628 716";
const RIDGE_SIDE =
  "M1118 716L1188 606L1224 638L1268 540L1300 572L1338 474L1372 514L1414 600L1458 664L1486 716";
const BANK =
  "M-40 900L-40 818C56 800 128 794 196 782C268 770 330 754 396 762C462 770 506 798 556 820C612 844 676 866 748 882L820 900";

function ScreenPainting({ uid }: { uid: string }) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <defs>
        <linearGradient
          id={`${uid}-far`}
          x1="0"
          y1="300"
          x2="0"
          y2="700"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="0.66" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={`${uid}-mid`}
          x1="0"
          y1="300"
          x2="0"
          y2="720"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="0.46" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.27" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.11" />
        </linearGradient>
        <linearGradient
          id={`${uid}-near`}
          x1="0"
          y1="720"
          x2="0"
          y2="900"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 远山 */}
      <path d={`${RIDGE_FAR}L1640 760L-60 760Z`} fill={`url(#${uid}-far)`} />
      <path
        data-edge=""
        d={RIDGE_FAR}
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.1"
      />

      {/* 中央淡峰：窄屏只取这一带，得有个山形撑着 */}
      <path
        d={`${RIDGE_CENTER}L596 720Z`}
        fill={`url(#${uid}-far)`}
        opacity="0.55"
      />

      {/* 主峰（左） */}
      <path d={`${RIDGE_MAIN}Z`} fill={`url(#${uid}-mid)`} />
      {/* 湿边：墨在绢上洇开的那一圈，比细线更能托住山形 */}
      <path
        d={RIDGE_MAIN}
        stroke="currentColor"
        strokeWidth="9"
        opacity="0.05"
      />
      <path
        d={RIDGE_MAIN}
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.08"
      />
      <path
        data-edge=""
        d={RIDGE_MAIN}
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.2"
      />

      {/* 副峰（右） */}
      <path d={`${RIDGE_SIDE}Z`} fill={`url(#${uid}-mid)`} />
      <path
        d={RIDGE_SIDE}
        stroke="currentColor"
        strokeWidth="8"
        opacity="0.045"
      />
      <path
        d={RIDGE_SIDE}
        stroke="currentColor"
        strokeWidth="2.6"
        opacity="0.07"
      />
      <path
        data-edge=""
        d={RIDGE_SIDE}
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.18"
      />

      {/* 皴：顺着山坡扫几笔，山才有筋骨 */}
      <g stroke="currentColor" strokeWidth="1.3" opacity="0.08">
        <path d="M402 336C392 392 376 436 358 470" />
        <path d="M424 366C416 418 404 456 390 484" />
        <path d="M384 404C372 444 358 474 342 498" />
        <path d="M1338 500C1330 546 1318 584 1304 612" />
        <path d="M1356 528C1350 566 1342 596 1332 618" />
      </g>

      {/* 披麻皴：一排排顺坡而下的短线，平涂才有笔意 */}
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.13">
        <path d="M396 350C380 400 356 446 330 486" />
        <path d="M386 372C368 420 344 466 318 502" />
        <path d="M374 398C356 442 334 484 308 516" />
        <path d="M360 430C344 470 322 506 300 534" />
        <path d="M344 462C330 496 310 528 290 552" />
        <path d="M332 494C320 524 302 552 286 574" />
        <path d="M318 526C306 552 290 576 274 594" />
        <path d="M306 558C296 580 282 600 268 616" />
        <path d="M468 500C480 528 494 552 510 572" />
        <path d="M480 528C492 552 504 572 518 590" />
        <path d="M418 372C430 412 448 448 468 478" />
        <path d="M430 400C442 438 458 470 476 496" />
        <path d="M442 430C454 464 468 492 486 514" />
        <path d="M454 462C466 492 480 518 496 540" />
        <path d="M1330 512C1320 552 1306 590 1292 618" />
        <path d="M1344 530C1336 566 1324 598 1312 624" />
        <path d="M1356 556C1350 588 1340 616 1330 640" />
        <path d="M1368 580C1362 608 1354 632 1346 652" />
      </g>

      {/* 苔点 */}
      <g fill="currentColor" stroke="none" opacity="0.18">
        <ellipse cx="404" cy="330" rx="3.2" ry="1.6" />
        <ellipse cx="414" cy="344" rx="2.2" ry="1.2" />
        <ellipse cx="392" cy="352" rx="2.6" ry="1.3" />
        <ellipse cx="1338" cy="492" rx="2.8" ry="1.4" />
        <ellipse cx="1328" cy="506" rx="2" ry="1.1" />
      </g>

      {/* 近坡 */}
      <path d={`${BANK}Z`} fill={`url(#${uid}-near)`} />
      <path d={BANK} stroke="currentColor" strokeWidth="1.4" opacity="0.1" />

      {/* 山下疏林：几笔竖点，最见远近 */}
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.17">
        <path d="M596 796v-14M604 798v-10M612 795v-16M620 798v-11M628 796v-13M636 798v-9" />
        <path d="M716 812v-12M724 814v-9M732 811v-14M740 814v-10M748 812v-12" />
        <path d="M64 856v-15M74 858v-11M84 854v-17M94 858v-12M104 855v-14M114 858v-10" />
      </g>

      {/* 水边小亭：几笔屋脊立柱，山水里最省事的一点人间 */}
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.26">
        <path d="M298 744c12-12 24-18 38-18s26 6 38 18" />
        <path d="M290 747c15-2 31-3 46-3s31 1 46 3" />
        <path d="M312 747v17M360 747v17" />
        <path d="M306 764h60" />
        <path d="M298 769h76" />
      </g>
      <g stroke="currentColor" strokeWidth="1" opacity="0.14">
        <path d="M336 726v-9M333 717h6" />
      </g>

      {/* 芦：水岸几茎，风一来就往一边倒 */}
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.2">
        <path d="M150 872c4-22 8-40 16-56" />
        <path d="M166 874c4-20 10-36 20-50" />
        <path d="M182 874c4-18 12-32 22-44" />
        <path d="M198 872c6-16 14-28 24-38" />
      </g>
      <g fill="currentColor" stroke="none" opacity="0.22">
        <ellipse cx="166" cy="814" rx="2.2" ry="5.4" transform="rotate(-14 166 814)" />
        <ellipse cx="186" cy="822" rx="2" ry="4.8" transform="rotate(-10 186 822)" />
        <ellipse cx="204" cy="828" rx="1.9" ry="4.4" transform="rotate(-6 204 828)" />
        <ellipse cx="222" cy="832" rx="1.8" ry="4" transform="rotate(-2 222 832)" />
      </g>

      {/* 月 */}
      <circle
        cx="1088"
        cy="188"
        r="82"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.16"
      />
      <circle
        cx="1088"
        cy="188"
        r="70"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.08"
      />

      {/* 飞鸟 */}
      <g stroke="currentColor" strokeWidth="1.3" opacity="0.22">
        <path d="M846 306q8-9 16 0q8-9 16 0" />
        <path d="M894 282q7-8 14 0q7-8 14 0" />
        <path d="M928 318q6-7 12 0q6-7 12 0" />
        <path d="M872 344q5-6 10 0q5-6 10 0" />
      </g>

      {/* 水纹 */}
      <g stroke="currentColor" strokeWidth="1.1" opacity="0.09">
        <path d="M720 796h46M786 796h22M760 814h88M866 814h40M700 832h54M772 832h120M820 850h70M908 850h36M744 868h110M872 868h60M980 802h64M1064 802h30M1120 824h88M1224 824h40M1010 848h120M1148 848h52M1180 870h74" />
      </g>

      {/* 孤舟 */}
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.22">
        <path d="M934 838q28 12 58 0" />
        <path d="M962 838v-13" />
        <path d="M951 826q11-10 22 0" />
        <path d="M952 848h34" />
      </g>

    </svg>
  );
}
