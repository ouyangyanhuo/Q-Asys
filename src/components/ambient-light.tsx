"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
  hueOffset: number;
}

export function AmbientLight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 尊重减弱动态设置
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setupCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();

    let mouseX = width / 2;
    let mouseY = height / 2;
    let hasPointerMoved = false;

    const count = Math.min(32, Math.max(16, Math.floor((width * height) / 35000)));
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.9 + Math.random() * 2.2,
        baseAlpha: 0.16 + Math.random() * 0.32,
        alpha: 0.2,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.18 - Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.012 + Math.random() * 0.02,
        hueOffset: (Math.random() - 0.5) * 20,
      });
    }

    const handleResize = () => {
      setupCanvas();
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) {
        if (e.touches.length > 0) {
          mouseX = e.touches[0].clientX;
          mouseY = e.touches[0].clientY;
          hasPointerMoved = true;
        }
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
        hasPointerMoved = true;
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        const isNight = document.documentElement.getAttribute("data-theme") === "night";

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          p.phase += p.phaseSpeed;
          p.alpha = p.baseAlpha * (0.65 + 0.35 * Math.sin(p.phase));

          p.x += p.vx;
          p.y += p.vy;

          // 鼠标或触控温和推斥效果
          if (hasPointerMoved) {
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110 && dist > 0) {
              const force = (110 - dist) / 110;
              p.x += (dx / dist) * force * 1.1;
              p.y += (dy / dist) * force * 1.1;
            }
          }

          // 飘出屏幕循环进入
          if (p.y < -12) {
            p.y = height + 12;
            p.x = Math.random() * width;
          }
          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;

          // 绘制雅致的光斑
          const glowRadius = p.radius * (isNight ? 3.2 : 2.4);
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);

          if (isNight) {
            // 烛光暖色：金黄与朱红相映
            gradient.addColorStop(0, `rgba(248, 196, 92, ${p.alpha * 1.1})`);
            gradient.addColorStop(0.55, `rgba(210, 78, 62, ${p.alpha * 0.45})`);
            gradient.addColorStop(1, "rgba(248, 196, 92, 0)");
          } else {
            // 暖阳米纸：温润赭石与淡金
            gradient.addColorStop(0, `rgba(180, 110, 35, ${p.alpha * 0.85})`);
            gradient.addColorStop(0.65, `rgba(178, 58, 44, ${p.alpha * 0.3})`);
            gradient.addColorStop(1, "rgba(180, 110, 35, 0)");
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
      aria-hidden="true"
    />
  );
}
