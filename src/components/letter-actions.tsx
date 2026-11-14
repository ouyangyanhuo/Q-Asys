"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { ShareModal } from "./share-modal";
import { showToast } from "./toast";

interface Spark {
  id: number;
  x: number;
}

export function LetterActions({ question }: { question: Question }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [resonated, setResonated] = useState(false);
  const [count, setCount] = useState(
    Math.abs(question.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 20) + 12
  );
  const [sparks, setSparks] = useState<Spark[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast("信件专属链接已复制");
    });
  };

  const handleResonate = () => {
    if (!resonated) {
      setResonated(true);
      setCount((prev) => prev + 1);

      const newSparks: Spark[] = [
        { id: Date.now() + 1, x: -12 },
        { id: Date.now() + 2, x: 0 },
        { id: Date.now() + 3, x: 14 },
      ];
      setSparks(newSparks);
      setTimeout(() => setSparks([]), 900);

      showToast("微光已传递", "seal");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleResonate}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-hei text-[11px] tracking-wider transition-all duration-300 ${
              resonated
                ? "bg-seal/10 text-seal font-medium shadow-xs"
                : "border border-rule bg-paper text-ink-soft hover:border-seal/40 hover:text-seal active:scale-95"
            }`}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-300 ${resonated ? "text-seal fill-current scale-110" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
            <span>{count} 微光</span>
          </button>

          {/* 粒子微光升腾效果 */}
          {sparks.map((spark) => (
            <span
              key={spark.id}
              className="spark-rise pointer-events-none absolute left-1/2 top-0 h-2 w-2 rounded-full bg-[#f5b84c] shadow-[0_0_8px_#f5b84c]"
              style={{ "--spark-x": `${spark.x}px` } as React.CSSProperties}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 border border-rule bg-paper px-3.5 py-1.5 font-hei text-[11px] tracking-wider text-ink-soft transition-colors hover:border-seal/40 hover:text-seal shadow-2xs active:translate-y-px"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span>生成信笺卡片</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 border border-rule bg-paper px-3.5 py-1.5 font-hei text-[11px] tracking-wider text-ink-soft transition-colors hover:border-seal/40 hover:text-seal shadow-2xs active:translate-y-px"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>复制链接</span>
        </button>
      </div>

      <ShareModal
        question={question}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
