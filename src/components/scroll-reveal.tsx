"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 滚动到视口再让它浮现。
 * 初始隐藏状态由 head 脚本加上的 `has-reveal` 负责，
 * 因此首帧就已就位，不会出现「先看到、再消失」的闪动。
 *
 * 依赖 pathname：客户端路由切走再切回时，新挂载的 [data-reveal]
 * 需要重新纳入观察，否则它们会一直停在 opacity:0（返回首页列表为空的根因）。
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
