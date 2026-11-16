"use client";

import { useState, useTransition, type CSSProperties } from "react";
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

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <label htmlFor="answer" className="label flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-seal" />
          <span>手书回函</span>
          {defaultAnswer && (
            <span className="border border-seal/50 px-1.5 py-px tracking-[0.12em] text-seal">
              已有回音
            </span>
          )}
        </label>
        <span className="font-mono text-label text-ink-faint">
          {[...text].length} 字
          <span className="hidden sm:inline"> · ⌘+Enter 落笔</span>
        </span>
      </div>

      {/* 常用寄语：点一下接在稿末 */}
      <div
        role="group"
        aria-labelledby="answer-templates"
        className="mt-3 flex flex-wrap items-center gap-1.5"
      >
        <span id="answer-templates" className="label mr-1">
          常用寄语
        </span>
        {TEMPLATES.map((t, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => insertTemplate(t)}
            title={t}
            aria-label={t}
            className="btn btn-line btn-sm kai-boost px-2 font-kai tracking-normal normal-case"
          >
            {t.slice(0, 10)}…
          </button>
        ))}
      </div>

      {/* 格线从元素顶起算、每 2.125rem 一道；顶上留 0.375rem，字脚正好落在线上 */}
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
        style={{ "--rows": 6 } as CSSProperties}
        aria-keyshortcuts="Meta+Enter Control+Enter"
        placeholder="援笔作复…（公之，则示于前台）"
        className="ruled mt-4 block w-full bg-transparent px-2 pt-1.5 pb-2 font-song text-body text-ink placeholder:font-kai placeholder:text-ink-faint/70"
      />

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" disabled={pending} className="btn btn-seal">
          {pending ? "送出中…" : defaultAnswer ? "改而存之" : "复而公之"}
        </button>
        {/* 提示条转瞬即逝，这一行是留得住的回执 */}
        <p role="status" className="font-kai text-small text-ink-faint">
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
        </p>
      </div>
    </form>
  );
}
