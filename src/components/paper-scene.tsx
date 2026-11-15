"use client";

import { useEffect, useRef } from "react";

interface Mote {
  x: number;
  y: number;
  r: number;
  base: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  depth: number;
  warm: boolean;
}

interface Fiber {
  x: number;
  y: number;
  len: number;
  angle: number;
  spin: number;
  vx: number;
  vy: number;
  alpha: number;
}

const WARM = {
  day: [198, 148, 78] as const,
  night: [250, 200, 104] as const,
};
const COOL = {
  day: [132, 118, 94] as const,
  night: [150, 164, 176] as const,
};
const FIBER = {
  day: "150,132,100",
  night: "204,186,158",
};

function makeSprite([r, g, b]: readonly [number, number, number]) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/**
 * 会动的纸：远景光晕与光束、中景墨晕、近景浮尘与纸纤维。
 * 浮尘全部预渲染成贴图再 drawImage，避免每帧创建渐变；
 * 指针视差与滚动视差合成到同一个 transform 上，只写一次样式。
 */
export function PaperScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const depthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const depth = depthRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.6);

    let isNight = document.documentElement.getAttribute("data-theme") === "night";
    let sprites = { warm: makeSprite(WARM.day), cool: makeSprite(COOL.day) };
    let fiberColor = FIBER.day;

    const buildLook = () => {
      isNight = document.documentElement.getAttribute("data-theme") === "night";
      sprites = isNight
        ? { warm: makeSprite(WARM.night), cool: makeSprite(COOL.night) }
        : { warm: makeSprite(WARM.day), cool: makeSprite(COOL.day) };
      fiberColor = isNight ? FIBER.night : FIBER.day;
      ctx.globalCompositeOperation = isNight ? "lighter" : "source-over";
    };
    buildLook();

    const setup = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = isNight ? "lighter" : "source-over";
    };
    setup();

    const makeMotes = (): Mote[] => {
      const count = Math.min(56, Math.max(18, Math.floor((width * height) / 30000)));
      return Array.from({ length: count }, () => {
        const depth = Math.random(); // 0 远 → 1 近
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.7 + depth * 2.6 + Math.random() * 0.8,
          base: 0.06 + depth * 0.2 + Math.random() * 0.08,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -(0.05 + depth * 0.28),
          phase: Math.random() * Math.PI * 2,
          speed: 0.004 + Math.random() * 0.014,
          depth,
          warm: Math.random() > 0.42,
        };
      });
    };

    const makeFibers = (): Fiber[] =>
      Array.from({ length: 9 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 8 + Math.random() * 16,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.0026,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -(0.04 + Math.random() * 0.1),
        alpha: 0.1 + Math.random() * 0.14,
      }));

    let motes = makeMotes();
    let fibers = makeFibers();

    let pointerX = width / 2;
    let pointerY = height / 2;
    let pointerSeen = false;
    let depthX = 0;
    let depthY = 0;
    let scrollOffset = 0;
    let time = 0;

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerSeen = true;
    };

    const onResize = () => {
      setup();
      motes = makeMotes();
      fibers = makeFibers();
    };

    const onScroll = () => {
      scrollOffset = Math.min(window.scrollY, 2600) * 0.03;
    };

    const onTheme = () => buildLook();

    let raf = 0;
    let visible = true;

    const render = () => {
      if (!visible) return;
      time += 0.016;

      ctx.clearRect(0, 0, width, height);

      // ── 浮尘：近处大而快，远处小而慢，各自轻微横摆
      for (const mote of motes) {
        mote.phase += mote.speed;
        mote.y += mote.vy;
        mote.x += mote.vx + Math.sin(time * 0.6 + mote.phase) * 0.06;

        if (pointerSeen) {
          const dx = mote.x - pointerX;
          const dy = mote.y - pointerY;
          const dist = Math.hypot(dx, dy);
          const reach = 90 + mote.depth * 90;
          if (dist < reach && dist > 0.001) {
            const force = ((reach - dist) / reach) * (0.4 + mote.depth * 0.9);
            mote.x += (dx / dist) * force;
            mote.y += (dy / dist) * force;
          }
        }

        if (mote.y < -60) {
          mote.y = height + 50;
          mote.x = Math.random() * width;
        }
        if (mote.x < -60) mote.x = width + 50;
        if (mote.x > width + 60) mote.x = -50;

        const alpha = mote.base * (0.5 + 0.5 * Math.sin(mote.phase));
        if (alpha <= 0.012) continue;

        const size = mote.r * (2.6 + mote.depth * 1.8);
        ctx.globalAlpha = Math.min(0.9, alpha);
        ctx.drawImage(
          mote.warm ? sprites.warm : sprites.cool,
          mote.x - size,
          mote.y - size,
          size * 2,
          size * 2,
        );
      }

      // ── 纸纤维：细短线，缓慢翻转飘移
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgb(${fiberColor})`;
      ctx.lineWidth = 1;
      for (const fiber of fibers) {
        fiber.angle += fiber.spin;
        fiber.x += fiber.vx + Math.sin(time * 0.4 + fiber.angle) * 0.08;
        fiber.y += fiber.vy;

        if (fiber.y < -40) {
          fiber.y = height + 30;
          fiber.x = Math.random() * width;
        }
        if (fiber.x < -40) fiber.x = width + 30;
        if (fiber.x > width + 40) fiber.x = -30;

        const half = fiber.len / 2;
        const cos = Math.cos(fiber.angle) * half;
        const sin = Math.sin(fiber.angle) * half;

        ctx.globalAlpha = fiber.alpha;
        ctx.beginPath();
        ctx.moveTo(fiber.x - cos, fiber.y - sin);
        ctx.lineTo(fiber.x + cos, fiber.y + sin);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── 视差：指针 + 滚动，合成一次 transform
      if (depth) {
        const targetX = pointerSeen ? (pointerX / width - 0.5) * -14 : 0;
        const targetY = pointerSeen ? (pointerY / height - 0.5) * -8 : 0;
        depthX += (targetX - depthX) * 0.035;
        depthY += (targetY - depthY) * 0.035;
        depth.style.transform = `translate3d(${depthX.toFixed(1)}px, ${(
          depthY + scrollOffset
        ).toFixed(1)}px, 0)`;
      }

      raf = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(render);
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("qasys-theme-change", onTheme);
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();
    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("qasys-theme-change", onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <div ref={depthRef} className="scene-depth">
        <div className="scene-wash scene-wash-a" />
        <div className="scene-wash scene-wash-b" />
        <div className="scene-bloom scene-bloom-a" />
        <div className="scene-bloom scene-bloom-b" />
      </div>
      <div className="scene-sweep" />
      <canvas ref={canvasRef} className="scene-dust" />
      <div className="scene-vignette" />
    </div>
  );
}
