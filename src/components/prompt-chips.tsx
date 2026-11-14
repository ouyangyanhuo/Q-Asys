"use client";

import { useState } from "react";

const INSPIRATION_PROMPTS = [
  "你最近一次觉得活着真好，是因为什么微小的事？",
  "有没有一句话，你一直想说，却始终没有说出口？",
  "如果能寄一封信给三年前的自己，你会写什么？",
  "怎么判断是「还没到时候」，还是「根本不会发生」？",
  "被爱和被理解，你觉得哪一个更难得？",
  "如果离开现在生活的地方，你最带不走的是什么？",
  "深夜失眠的时候，你通常会想些什么？",
  "那些慢慢走散的朋友，你还会偶尔想起来吗？",
  "做过最勇敢、但没人知道的决定是什么？",
  "今天，你过得开心吗？",
];

interface PromptChipsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptChips({ onSelectPrompt }: PromptChipsProps) {
  const [startIndex, setStartIndex] = useState(0);

  const cyclePrompts = () => {
    setStartIndex((prev) => (prev + 3) % INSPIRATION_PROMPTS.length);
  };

  const visible = [
    INSPIRATION_PROMPTS[startIndex % INSPIRATION_PROMPTS.length],
    INSPIRATION_PROMPTS[(startIndex + 1) % INSPIRATION_PROMPTS.length],
    INSPIRATION_PROMPTS[(startIndex + 2) % INSPIRATION_PROMPTS.length],
  ];

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center justify-between font-hei text-[10.5px] tracking-[0.2em] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <svg className="h-3 w-3 text-seal/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          灵感笺条 · 点击试笔
        </span>
        <button
          type="button"
          onClick={cyclePrompts}
          className="group flex items-center gap-1 transition-colors hover:text-seal"
        >
          <svg className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          换一批
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="group relative rounded-sm border border-rule/80 bg-paper/60 px-3 py-1.5 text-left font-kai text-[12px] leading-relaxed text-ink-soft transition-all duration-300 hover:border-seal/50 hover:bg-paper-soft hover:text-seal hover:shadow-xs active:scale-[0.98]"
          >
            <span className="line-clamp-1">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
