"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "info" | "success" | "seal";
}

let toastListeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(text: string, type: "info" | "success" | "seal" = "seal") {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((fn) => fn({ id, text, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3400);
    };

    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2.5">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="stamp-in flex items-center gap-3 border border-rule bg-paper-soft/95 px-5 py-2.5 shadow-[0_14px_34px_-10px_rgba(28,25,23,0.32)] backdrop-blur-sm"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-seal/60 font-kai text-[11px] text-seal shadow-2xs">
            {toast.type === "success" ? "吉" : "印"}
          </span>
          <span className="font-kai text-[13px] tracking-wider text-ink">
            {toast.text}
          </span>
        </div>
      ))}
    </div>
  );
}
