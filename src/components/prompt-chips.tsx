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
  "今晨推窗，可曾为哪一缕风驻足？",
  "近来可有一事，令你几欲落泪又忍住？",
  "你心中可有「虽千万人吾往矣」的倔强？",
  "若以一字概括今岁，你会拈取哪个？",
  "那些回不去的旧时光，你最念哪一段？",
  "独处之时，你是与自己言和，还是较劲？",
  "可有一人，你愿为其破自己的例？",
  "若明日便是终点，今日你当如何过？",
  "你以为的「来日方长」，可还记得些什么？",
  "行路至此，你可曾辜负年少时的自己？",
  "近来夜读，可有一句戳中心事？",
  "你最想在何时，收到谁的只言片语？",
  "若云可寄情，你此刻想托它捎往何处？",
  "你有多久，未曾好好吃一顿饭了？",
  "一壶茶凉了又续，像极了哪一种等待？",
  "你怕的究竟是老去，还是从未真正活过？",
  "若可与一人对坐无言，你选谁？",
  "你心中可有一处，是永远的归处？",
  "近来可曾为谁，悄悄红了眼眶？",
  "行囊渐轻，你舍下的都是些什么？",  
  "若岁月可回首，你最想重走哪一程？",
  "你心中可还留着一盏，为谁而点的灯？",
  "未曾说出口的告别，是不是最难忘？",
  "有些路走着走着就懂了，你懂了什么？",
  "若失而复得，你最想拾回哪一件？",
  "你在等的那个人，可还记得你的模样？",
  "偶得半日闲，你最先想做的是什么？",
  "季节换了又换，你的心事换了没有？",
  "若可重来一次，你会不会仍做此选择？",
  "那些无人知晓的夜，你是怎么走来的？",
  "你最想对「现在的自己」说句什么？",
  "可有一种温柔，是你给自己的？",
  "念念不忘的，究竟是人，还是那段日子？",
  "你有多久，没抬头认真看过月亮？",
  "若心事可安放，你会把它寄在何处？",
  "有些话讲了是打扰，你忍住了几回？",
  "你最喜欢的自己，是在哪一年遇见的？",
  "若此刻可许一愿，你敢不敢说出口？",
  "走得太快的时候，你丢了些什么？",
  "待到尘埃落定，你希望自己是何模样？",
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
          另拈数条
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
