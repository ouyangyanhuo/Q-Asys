"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Question } from "@/lib/types";
import { formatDay } from "@/lib/format";
import { WaxSeal, CancellationMark, PostageStamp } from "./stamp-badge";
import Link from "next/link";

interface RandomLetterModalProps {
  letters: Question[];
  isOpen: boolean;
  onClose: () => void;
}

export function RandomLetterModal({ letters, isOpen, onClose }: RandomLetterModalProps) {
  const [selected, setSelected] = useState<Question | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && letters.length > 0) {
      drawRandom();
    }
  }, [isOpen]);

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

  const drawRandom = () => {
    if (letters.length === 0) return;
    setIsFlipping(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * letters.length);
      setSelected(letters[idx]);
      setIsFlipping(false);
    }, 280);
  };

  if (!isOpen || !mounted) return null;

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
          className="modal-card relative my-auto w-full max-w-[540px]"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="sheet-shadow relative overflow-hidden border border-rule bg-paper-soft p-7 md:p-10">
          {/* 顶部标签 */}
          <div className="flex items-center justify-between border-b border-rule/70 pb-4">
            <div className="flex items-center gap-2.5">
              <WaxSeal character="缘" size="sm" />
              <div>
                <h3 className="font-song text-[15px] tracking-widest text-ink">
                  偶遇信签
                </h3>
                <p className="font-hei text-[9.5px] tracking-wider text-ink-faint">
                  从时光深处抽出的某一封
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={drawRandom}
              disabled={isFlipping}
              className="flex items-center gap-1.5 border border-seal/30 bg-seal/[0.04] px-3.5 py-1.5 font-hei text-[10.5px] tracking-wider text-seal shadow-2xs transition-all hover:bg-seal/[0.08] hover:scale-102 active:scale-95 disabled:opacity-50"
            >
              <svg className={`h-3 w-3 ${isFlipping ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>再拈一封</span>
            </button>
          </div>

          {/* 信件内容展示区域 */}
          <div className={`py-6 transition-all duration-300 ${isFlipping ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
            {selected ? (
              <div>
                <div className="flex items-center justify-between font-hei text-[10px] tracking-widest text-ink-faint">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">LETTER ARCHIVE</span>
                    <span className="h-2 w-px bg-rule" />
                    <span>{formatDay(selected.createdAt)}</span>
                  </div>
                  <PostageStamp theme="moon" price="80" color="seal" size="sm" className="scale-85" />
                </div>

                <p className="mt-4 font-kai text-[19px] leading-[1.88] text-ink md:text-[21px]">
                  {selected.body}
                </p>

                {selected.nickname ? (
                  <p className="mt-3.5 text-right font-kai text-[12.5px] text-ink-faint">
                    —— {selected.nickname}
                  </p>
                ) : (
                  <p className="mt-3.5 text-right font-kai text-[11.5px] text-ink-faint/60">
                    —— 匿名旅人
                  </p>
                )}

                {selected.answer ? (
                  <div className="mt-6 border-t border-dashed border-rule pt-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center border border-seal/50 font-kai text-[10px] text-seal shadow-2xs">
                        答
                      </span>
                      <p className="whitespace-pre-wrap font-song text-[14.5px] leading-[1.95] text-ink-soft">
                        {selected.answer}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 pl-8 font-kai text-[12px] text-ink-faint/70">
                    此函静候复音…
                  </p>
                )}

                <div className="mt-7 flex items-center justify-between border-t border-rule/50 pt-4">
                  <CancellationMark date="2026.11" location="尺素" className="scale-75" />
                  <Link
                    href={`/q/${selected.id}`}
                    onClick={onClose}
                    className="group/arr flex items-center gap-1 font-hei text-[11px] tracking-wider text-seal transition-colors hover:text-[#9d3125]"
                  >
                    <span>展 阅 此 笺</span>
                    <span className="transition-transform duration-300 group-hover/arr:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center font-kai text-ink-faint">
                信箱尚空，无笺可拈。
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 font-hei text-[11px] tracking-wider text-paper-soft/80 transition-colors hover:text-white"
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
