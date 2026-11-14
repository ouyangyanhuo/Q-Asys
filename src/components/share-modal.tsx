"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Question } from "@/lib/types";
import { formatFullDate } from "@/lib/format";
import { PostageStamp, CancellationMark, WaxSeal } from "./stamp-badge";
import { showToast } from "./toast";

interface ShareModalProps {
  question: Question;
  number?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ question, number, isOpen, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("专笺之址已录");
    });
  };

  const handleCopyText = () => {
    const text = `【尺素】\n问：${question.body}${question.nickname ? ` —— ${question.nickname}` : ""}\n${question.answer ? `\n答：${question.answer}\n` : ""}\n原笺：${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast("笺中文字已录");
    });
  };

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 overflow-y-auto overscroll-contain backdrop-blur-md"
      style={{ backgroundColor: "rgba(20, 18, 16, 0.65)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full min-h-dvh w-full justify-center p-4 py-8 sm:p-6 sm:py-12">
        <div
          className="modal-card relative my-auto w-full max-w-[560px]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* 卡片主体：传统八行笺雅致风格 */}
        <div
          ref={cardRef}
          className="ruled-vertical sheet-shadow relative overflow-hidden border border-rule bg-paper-soft p-6 md:p-10"
        >
          {/* 八行笺红丝栏内外边框 */}
          <div className="pointer-events-none absolute inset-3 border border-seal/20" />
          <div className="pointer-events-none absolute inset-[15px] border border-seal/10" />

          {/* 顶部信头 */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-hei text-[10px] tracking-[0.32em] text-ink-faint">
                尺素 · 笺谱留真
              </span>
              <span className="mt-1 font-mono text-[11px] font-medium text-ink-faint">
                {number ? `NO. ${String(number).padStart(3, "0")}` : "LETTER ARCHIVE"}
              </span>
              <span className="mt-0.5 font-hei text-[9.5px] text-ink-faint/80">
                {formatFullDate(question.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CancellationMark date="2026.11" location="尺素" className="scale-75" />
              <PostageStamp theme="lantern" price="80" color="seal" size="sm" />
            </div>
          </div>

          {/* 信件问题内容 */}
          <div className="my-8">
            <p className="font-kai text-[19px] leading-[1.88] text-ink md:text-[21px]">
              {question.body}
            </p>
            {question.nickname ? (
              <p className="mt-3.5 text-right font-kai text-[12.5px] text-ink-faint">
                —— {question.nickname}
              </p>
            ) : (
              <p className="mt-3.5 text-right font-kai text-[11.5px] text-ink-faint/70">
                —— 匿名旅人
              </p>
            )}
          </div>

          {/* 回信部分 */}
          {question.answer && (
            <div className="border-t border-dashed border-rule pt-6">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center border border-seal/50 font-kai text-[10.5px] text-seal shadow-2xs">
                  答
                </span>
                <p className="whitespace-pre-wrap font-song text-[14.5px] leading-[2.05] text-ink-soft">
                  {question.answer}
                </p>
              </div>
            </div>
          )}

          {/* 底部邮印水印 */}
          <div className="mt-8 flex items-center justify-between border-t border-rule/60 pt-4 font-hei text-[9.5px] text-ink-faint">
            <span>有些话，不必署名。</span>
            <div className="flex items-center gap-2">
              <WaxSeal character="信" size="sm" />
              <span>尺素 · 永久存留</span>
            </div>
          </div>
        </div>

        {/* 底部操作按钮栏 */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 border border-rule/80 bg-paper-soft px-4 py-2 font-hei text-[11px] tracking-wider text-ink transition-colors hover:border-seal/60 hover:text-seal shadow-xs active:translate-y-px"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              录专属之址
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 border border-rule/80 bg-paper-soft px-4 py-2 font-hei text-[11px] tracking-wider text-ink transition-colors hover:border-seal/60 hover:text-seal shadow-xs active:translate-y-px"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              录其文字
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-transparent px-4 py-2 font-hei text-[11px] tracking-wider text-paper-soft/90 transition-colors hover:text-white"
          >
            掩 卷 ESC
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
}
