"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** 退场动画要靠 overlay 与可过渡的 display；Firefox、Safari 还没齐，得用脚本垫一下 */
let exitSupport: boolean | undefined;
function supportsTopLayerExit(): boolean {
  if (exitSupport !== undefined) return exitSupport;
  if (
    !window.CSS?.supports?.("overlay", "auto") ||
    !window.CSS.supports("transition-behavior", "allow-discrete")
  ) {
    return (exitSupport = false);
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  exitSupport = getComputedStyle(probe).display === "block";
  probe.remove();
  return exitSupport;
}

async function closeWithExit(dialog: HTMLDialogElement) {
  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
    }
    dialog.removeAttribute("data-closing");
  }
  if (dialog.open) dialog.close();
}

/**
 * 弹层：原生 <dialog> 以 showModal() 打开。
 * 焦点圈定、Esc、背景失活、关闭后焦点归位都由浏览器负责；
 * 点在纸外即合上（closedby="any"，不支持处由下方脚本补上）。
 * 内容只在展开期间渲染，合上的弹层只是一个空壳。
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  label,
  width,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** 弹层标题元素的 id */
  labelledBy?: string;
  /** 没有可见标题时给一个名字 */
  label?: string;
  /** 最大宽度，任意 CSS 长度；缺省 35rem */
  width?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [filled, setFilled] = useState(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      setFilled(true);
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;

    let alive = true;
    closeWithExit(dialog).then(() => {
      // 留足退场的时间再清空内容
      window.setTimeout(() => alive && setFilled(false), 320);
    });
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Esc 与点在纸外都先报到 cancel：拦下来交给父级改状态，好走同一套退场
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    // 其他途径（如 form method="dialog"）合上的，也让父级知道
    const onNativeClose = () => onClose();

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onNativeClose);

    // closedby 尚未普及：按下与抬起都落在纸外才算，免得拖选文字时误合
    let pressedOutside = false;
    const outside = (event: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      );
    };
    const onDown = (event: PointerEvent) => {
      pressedOutside = outside(event);
    };
    const onUp = (event: PointerEvent) => {
      if (pressedOutside && outside(event)) onClose();
    };
    const needsFallback = !("closedBy" in HTMLDialogElement.prototype);
    if (needsFallback) {
      dialog.addEventListener("pointerdown", onDown);
      dialog.addEventListener("pointerup", onUp);
    }

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onNativeClose);
      if (needsFallback) {
        dialog.removeEventListener("pointerdown", onDown);
        dialog.removeEventListener("pointerup", onUp);
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      style={width ? ({ "--modal-w": width } as React.CSSProperties) : undefined}
      {...({ closedby: "any" } as object)}
    >
      {filled ? children : null}
    </dialog>
  );
}
