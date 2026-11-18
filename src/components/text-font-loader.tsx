"use client";

import { useEffect } from "react";

/**
 * 首页正文字体的后台补齐。
 *
 * 固定文案用的小子集（Chisu Song / Chisu Kai）已在 CSS 里，首屏即用；
 * 这里等这两个字体落定之后，趁空闲把含常用三千八百字的大子集取回来。
 *
 * 一个必要的前置判断：如果本机已经有更好的字（苹果的宋与楷），
 * 小子集根本不会被取用，那么大子集也不该下载——否则等于给 Mac 用户
 * 白送 2.4MB。判断方式就看「Chisu Song 这个小包到底有没有被浏览器取用」。
 *
 * 必须等 document.fonts.ready：字体还在 loading 时 status 不是 loaded，
 * 会被误判成「本机有好字」，从此再也不下大包（慢网实测确实如此）。
 */
const TEXT_FACES = [
  {
    probe: "Chisu Song",
    family: "Chisu Song Text",
    url: "/fonts/v1/text-song.woff2",
    weight: "200 900",
  },
  {
    probe: "Chisu Kai",
    family: "Chisu Kai Text",
    url: "/fonts/v1/text-kai.woff2",
    weight: "400",
  },
] as const;

/** 同一个页面生命周期里只注入一次，客户端路由来回切换不重复加 */
const injected = new Set<string>();

function statusOf(family: string): FontFace["status"] | null {
  for (const face of document.fonts) {
    if (face.family.replace(/["']/g, "") === family) return face.status;
  }
  return null;
}

function loadTextFaces() {
  for (const { probe, family, url, weight } of TEXT_FACES) {
    if (injected.has(family)) continue;

    const status = statusOf(probe);
    // loaded / loading 说明 UI 子集被取用了，系统没有更合适的字；
    // unloaded 说明系统字先命中，UI 子集一个字节都没下，大包也不必下。
    if (status !== "loaded" && status !== "loading") continue;

    const face = new FontFace(family, `url(${url})`, {
      weight,
      style: "normal",
      display: "swap",
    });
    document.fonts.add(face);
    injected.add(family);
    face.load().catch(() => {
      injected.delete(family);
    });
  }
}

export function TextFontLoader() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 等首屏那两位先落定，再决定要不要补大包，避免抢带宽与误判
      await document.fonts.ready;
      if (cancelled) return;
      loadTextFaces();
    };

    const schedule = () => {
      if (cancelled) return () => {};
      const idle = window.requestIdleCallback
        ? window.requestIdleCallback(() => void run(), { timeout: 4000 })
        : window.setTimeout(() => void run(), 600);

      return () => {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
        window.clearTimeout(idle);
      };
    };

    const doc = document.documentElement;
    if (doc.hasAttribute("data-screen")) {
      let cleanSchedule: (() => void) | undefined;
      const onDone = () => {
        window.removeEventListener("qasys-screen-done", onDone);
        window.clearTimeout(fallback);
        cleanSchedule = schedule();
      };

      window.addEventListener("qasys-screen-done", onDone);
      // 兜底：开屏事件若未捕获，5秒后在空闲时段补齐
      const fallback = window.setTimeout(onDone, 5000);

      return () => {
        cancelled = true;
        window.removeEventListener("qasys-screen-done", onDone);
        window.clearTimeout(fallback);
        cleanSchedule?.();
      };
    }

    const clean = schedule();
    return () => {
      cancelled = true;
      clean?.();
    };
  }, []);

  return null;
}
