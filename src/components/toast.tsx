"use client";

import { useEffect, useRef, useState } from "react";
import { Seal } from "./stamp-badge";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "info" | "success" | "seal";
}

let toastListeners: Array<(toast: ToastMessage) => void> = [];

/**
 * 一条转瞬即逝的提示。它只是锦上添花：
 * 同一件事在页面上必须另有着落（按钮换了字、回执已出现），提示消失后仍可得知。
 * 弹层里不要用它——弹层之外的内容对读屏是失活的。
 */
export function showToast(
  text: string,
  type: "info" | "success" | "seal" = "seal",
) {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((fn) => fn({ id, text, type }));
}

const GLYPH: Record<NonNullable<ToastMessage["type"]>, string> = {
  seal: "印",
  success: "吉",
  info: "知",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);

      // 读屏播报：有 ariaNotify 用它，没有就写进常驻的 live region
      const doc = document as Document & {
        ariaNotify?: (message: string) => void;
      };
      if (typeof doc.ariaNotify === "function") doc.ariaNotify(toast.text);
      else if (liveRef.current) liveRef.current.textContent = toast.text;

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3400);
    };

    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handler);
    };
  }, []);

  // 有提示时把容器送进顶层，免得被别的层叠上下文压住
  useEffect(() => {
    const region = regionRef.current;
    if (!region || typeof region.showPopover !== "function") return;
    try {
      if (toasts.length > 0) region.showPopover();
      else region.hidePopover();
    } catch {
      // 已处于目标状态时会抛错，无妨
    }
  }, [toasts.length]);

  return (
    <>
      <div
        ref={regionRef}
        role="region"
        aria-label="提示"
        className="toast-region"
        {...({ popover: "manual" } as object)}
      >
        <div className="flex flex-col items-center gap-2.5">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="slip-in flex items-center gap-3 border border-rule bg-paper-soft px-4 py-2.5 shadow-[var(--shadow-lift)]"
            >
              <Seal
                text={GLYPH[toast.type ?? "seal"]}
                size="1.5rem"
                worn={false}
              />
              <span className="font-kai text-small tracking-wider text-ink">
                {toast.text}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div ref={liveRef} aria-live="polite" className="sr-only" />
    </>
  );
}
