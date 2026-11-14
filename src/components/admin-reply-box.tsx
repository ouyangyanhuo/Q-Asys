"use client";

import { useState } from "react";
import { saveAnswerAction } from "@/lib/admin-actions";

const TEMPLATES = [
  "见字如面。愿你万事顺遂，常有微光相伴。",
  "世事虽匆忙，也请给自己多一点宽容，慢慢来。",
  "有些路总要一个人走过，但请记得你并不孤单。",
  "谢谢你愿意把心事托付于此，我都认真读完了。",
  "天色渐晚，今晚好好睡一觉吧。",
];

export function AdminReplyBox({
  id,
  defaultAnswer,
}: {
  id: string;
  defaultAnswer: string;
}) {
  const [text, setText] = useState(defaultAnswer);

  const insertTemplate = (t: string) => {
    setText((prev) => (prev ? `${prev}\n\n${t}` : t));
  };

  return (
    <form action={saveAnswerAction} className="mt-7">
      <input type="hidden" name="id" value={id} />

      <div className="flex items-center justify-between">
        <label
          htmlFor="answer"
          className="flex items-center gap-2 font-hei text-[11px] tracking-[0.2em] text-ink-faint"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-seal" />
          <span>手 书 回 函</span>
        </label>
        <span className="font-mono text-[10.5px] text-ink-faint">
          {[...text].length} 字 · ⌘+Enter 落笔
        </span>
      </div>

      {/* 常用寄语快捷插入 */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="self-center font-hei text-[10px] text-ink-faint">
          常用寄语：
        </span>
        {TEMPLATES.map((t, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => insertTemplate(t)}
            className="rounded border border-rule/80 bg-paper/70 px-2 py-0.5 font-kai text-[11px] text-ink-soft shadow-2xs transition-colors hover:border-seal/40 hover:text-seal active:scale-98"
          >
            {t.slice(0, 10)}…
          </button>
        ))}
      </div>

      <textarea
        id="answer"
        name="answer"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
        rows={6}
        placeholder="援笔作复…（公之，则示于前台）"
        className="ruled mt-3 w-full resize-none bg-transparent px-2 pb-2 pt-[10px] font-song text-[15.5px] leading-[34px] text-ink outline-none placeholder:font-kai placeholder:text-ink-faint/50"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="bg-seal px-6 py-2.5 font-hei text-[11.5px] tracking-[0.28em] text-paper-soft shadow-[inset_0_0_0_1px_rgba(251,247,238,0.2)] transition-all hover:bg-[#9d3125] shadow-xs active:translate-y-px"
        >
          复 而 公 之
        </button>
        <span className="font-kai text-[11.5px] text-ink-faint">
          公之，则即刻见于前台
        </span>
      </div>
    </form>
  );
}
