"use client";

import { useState, useTransition } from "react";
import { showToast } from "./toast";
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
  const [pending, startTransition] = useTransition();
  const [sentAt, setSentAt] = useState<number | null>(null);

  const insertTemplate = (t: string) => {
    setText((prev) => (prev ? `${prev}\n\n${t}` : t));
    setSentAt(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveAnswerAction({ status: "idle" }, formData);

      if (result.status === "ok") {
        setSentAt(result.at ?? Date.now());
        showToast(result.message ?? "回函已送出", "seal");
      } else {
        showToast(result.message ?? "未能送出，请再试一次", "info");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-7">
      <input type="hidden" name="id" value={id} />

      <div className="flex items-center justify-between">
        <label
          htmlFor="answer"
          className="flex items-center gap-2 font-hei text-[11px] tracking-[0.2em] text-ink-faint"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-seal" />
          <span>手 书 回 函</span>
          {defaultAnswer && (
            <span className="border border-seal/35 px-1.5 py-px text-[10.5px] tracking-[0.12em] text-seal/80">
              已 有 回 音
            </span>
          )}
        </label>
        <span className="font-mono text-[11.5px] text-ink-faint">
          {[...text].length} 字 · ⌘+Enter 落笔
        </span>
      </div>

      {/* 常用寄语快捷插入 */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="self-center font-hei text-[11px] text-ink-faint">
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
        onChange={(e) => {
          setText(e.target.value);
          setSentAt(null);
        }}
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
          disabled={pending}
          className="bg-seal px-6 py-2.5 font-hei text-[11.5px] tracking-[0.28em] text-paper-soft shadow-[inset_0_0_0_1px_rgba(251,247,238,0.2)] transition-all hover:bg-[#9d3125] shadow-xs active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "送 出 中…"
            : defaultAnswer
              ? "改 而 存 之"
              : "复 而 公 之"}
        </button>
        <span className="font-kai text-[11.5px] text-ink-faint">
          {pending
            ? "正在缄封…"
            : sentAt
              ? `已于 ${new Date(sentAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} 送出 · 前台即刻可见`
              : defaultAnswer
                ? "此函已有回音，落笔即覆原稿"
                : "公之，则即刻见于前台"}
        </span>
      </div>
    </form>
  );
}
