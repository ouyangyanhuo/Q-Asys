"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Question } from "@/lib/types";
import { formatDay } from "@/lib/format";
import { Modal } from "./modal";
import { PostageStamp, Postmark, Seal, stampOf } from "./stamp-badge";

interface RandomLetterModalProps {
  letters: Question[];
  isOpen: boolean;
  onClose: () => void;
}

export function RandomLetterModal({ letters, isOpen, onClose }: RandomLetterModalProps) {
  const [selected, setSelected] = useState<Question | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const drawRandom = () => {
    if (letters.length === 0) return;
    setIsFlipping(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * letters.length);
      setSelected(letters[idx]);
      setIsFlipping(false);
    }, 280);
  };

  useEffect(() => {
    if (isOpen && letters.length > 0) drawRandom();
    // 只在展开的瞬间拈一封，改动 letters 不重抽
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stamp = selected ? stampOf(selected.id) : null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy="random-modal-heading"
      width="34rem"
    >
      <div className="sheet frame relative overflow-hidden px-6 py-7 md:px-10 md:py-9">
        {/* 顶部题签与再拈一枚 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
          <div className="flex items-center gap-3">
            <Seal text="缘" size="2rem" />
            <div>
              <h2
                id="random-modal-heading"
                className="font-song text-small tracking-[0.22em] text-ink"
              >
                偶遇信签
              </h2>
              <p className="mt-0.5 font-kai text-[11px] text-ink-faint">
                从时光深处抽出的某一封
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={drawRandom}
            disabled={isFlipping}
            className="btn btn-line btn-sm"
          >
            <RefreshCw className={`size-3 ${isFlipping ? "spin-slow" : ""}`} />
            再拈一封
          </button>
        </div>

        {/* 信件内容：抽换时整体淡出淡入 */}
        <div
          className={`py-6 transition-all duration-300 ${
            isFlipping ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {selected && stamp ? (
            <div>
              <div className="flex items-center justify-between gap-3 font-kai text-[11px] text-ink-faint">
                <span className="flex items-center gap-2">
                  <span>来 鸿</span>
                  <span className="h-2 w-px bg-rule" />
                  <time dateTime={selected.createdAt}>
                    {formatDay(selected.createdAt)}
                  </time>
                </span>
                <PostageStamp
                  theme={stamp.theme}
                  color={stamp.color}
                  price={stamp.price}
                  size="sm"
                  tilt={stamp.tilt}
                />
              </div>

              <p className="mt-4 font-kai text-letter leading-[1.88] text-ink">
                {selected.body}
              </p>

              <p className="mt-3.5 text-right font-kai text-label text-ink-faint">
                —— {selected.nickname || "匿名旅人"}
              </p>

              {selected.answer ? (
                <div className="mt-6 border-t border-dashed border-rule pt-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex size-6 shrink-0 items-center justify-center border border-seal/50 font-kai text-[11px] text-seal">
                      答
                    </span>
                    <p className="reply whitespace-pre-wrap font-song text-small text-ink-soft">
                      {selected.answer}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 font-kai text-label text-ink-faint">
                  此函静候复音…
                </p>
              )}

              <div className="mt-7 flex items-center justify-between gap-3 border-t border-rule pt-4">
                <Postmark
                  place="尺素"
                  date={selected.createdAt.slice(0, 7).replace("-", ".")}
                  className="scale-75"
                />
                <Link
                  href={`/q/${selected.id}`}
                  onClick={onClose}
                  className="group/arr flex items-center gap-1 font-kai text-label tracking-[0.16em] text-seal transition-colors hover:text-seal-deep"
                >
                  <span>展 阅 此 笺</span>
                  <span className="transition-transform duration-300 group-hover/arr:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center font-kai text-note text-ink-faint">
              信箱尚空，无笺可拈。
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onClose} className="btn btn-sm text-ink-faint">
          掩 卷
        </button>
      </div>
    </Modal>
  );
}
