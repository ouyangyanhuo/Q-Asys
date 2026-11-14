"use client";

import { useState, useTransition } from "react";
import { submitQuestion, type SubmitState } from "@/lib/actions";
import { formatMonth } from "@/lib/format";
import { MAX_BODY } from "@/lib/types";

export function ComposeCard() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const count = [...body].length;
  const done = state.status === "ok" && state.at !== dismissedAt;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({ status: "idle" });

    startTransition(async () => {
      const result = await submitQuestion(formData);
      setState(result);
      if (result.status === "ok") {
        setBody("");
        setNickname("");
      }
    });
  }

  function writeAnother() {
    setDismissedAt(state.at ?? null);
    setBody("");
    setNickname("");
  }

  return (
    <div
      id="write"
      className="reveal relative scroll-mt-24"
      style={{ animationDelay: "260ms" }}
    >
      <div
        className="absolute inset-x-5 -top-1.5 h-3 border border-rule/60 bg-paper-deep/40"
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="sheet-shadow relative border border-rule bg-paper-soft transition-shadow duration-500"
      >
        <div className="px-7 pt-6 md:px-9">
          <div className="flex items-baseline justify-between font-hei text-[11px] tracking-[0.22em] text-ink-faint">
            <span>致 · 收信人</span>
            <span className="font-song tracking-[0.12em] text-ink-faint/80">
              {formatMonth()}
            </span>
          </div>
          <div className="mt-4 h-px bg-rule" />
        </div>

        <label className="sr-only" htmlFor="letter-body">
          你的问题
        </label>
        <textarea
          id="letter-body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={MAX_BODY}
          rows={6}
          spellCheck={false}
          placeholder="想问点什么…"
          className="ruled mt-2 block w-full resize-none bg-transparent px-7 pb-3 pt-[10px] font-kai text-[17px] leading-[34px] text-ink outline-none placeholder:text-ink-faint/55 md:px-9"
        />

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-4 border-t border-rule px-6 py-5 md:px-9">
          <label className="flex items-baseline gap-2.5">
            <span className="font-hei text-[11px] tracking-[0.2em] text-ink-faint">
              署名
            </span>
            <input
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="可留空"
              autoComplete="off"
              className="w-24 border-b border-rule bg-transparent pb-1 font-kai text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint/50 focus:border-seal/60"
            />
          </label>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-ink-faint/80">
              {count}/{MAX_BODY}
            </span>
            <button
              type="submit"
              disabled={pending || count === 0}
              className="bg-seal px-6 py-2.5 font-hei text-[12px] tracking-[0.3em] text-paper-soft shadow-[inset_0_0_0_1px_rgba(251,247,238,0.18)] transition-all duration-300 hover:bg-[#9d3125] hover:shadow-[inset_0_0_0_1px_rgba(251,247,238,0.28)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-faint disabled:shadow-none"
            >
              {pending ? "封缄中" : "投 递"}
            </button>
          </div>
        </div>

        <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
          <label>
            网站
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {state.status === "error" && (
          <p
            role="status"
            className="fade-up border-t border-seal/20 bg-seal/[0.04] px-7 py-3 font-kai text-[12.5px] text-seal md:px-9"
          >
            {state.message}
          </p>
        )}

        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-paper-soft px-8 text-center">
            <div className="stamp-in border-[3px] border-seal px-7 py-2.5 font-song text-[23px] tracking-[0.3em] text-seal">
              已 投 递
            </div>
            <p className="fade-up font-kai text-[13.5px] leading-[1.9] text-ink-soft">
              我会认真读的。
              <br />
              回信会出现在下面的信箱里。
            </p>
            <button
              type="button"
              onClick={writeAnother}
              className="fade-up font-hei text-[11px] tracking-[0.22em] text-seal underline decoration-seal/35 underline-offset-[6px] transition-colors hover:decoration-seal"
            >
              再写一封
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
