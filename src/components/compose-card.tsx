"use client";

import { useState, useTransition, useRef } from "react";
import { submitQuestion, type SubmitState } from "@/lib/actions";
import { formatMonth } from "@/lib/format";
import { MAX_BODY } from "@/lib/types";
import { PromptChips } from "./prompt-chips";
import { WaxSeal, CancellationMark } from "./stamp-badge";
import { showToast } from "./toast";

const SEAL_OPTIONS = ["信", "心", "光", "忆", "问", "安"];

export function ComposeCard() {
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedSeal, setSelectedSeal] = useState("信");
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [isSubmittingAnim, setIsSubmittingAnim] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const count = [...body].length;
  const done = state.status === "ok" && state.at !== dismissedAt;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (count === 0 || pending) return;

    const formData = new FormData(event.currentTarget);
    setState({ status: "idle" });
    setIsSubmittingAnim(true);

    startTransition(async () => {
      // 封缄入筒仪式感延迟
      await new Promise((resolve) => setTimeout(resolve, 650));
      const result = await submitQuestion(formData);
      setIsSubmittingAnim(false);
      setState(result);
      if (result.status === "ok") {
        setBody("");
        setNickname("");
        showToast("已入信箱，静候回音", "seal");
      }
    });
  }

  function handleSelectPrompt(promptText: string) {
    setBody(promptText);
    textareaRef.current?.focus();
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
      {/* 顶部信封折边装饰 */}
      <div
        className="absolute inset-x-6 -top-2.5 h-4 border border-rule/70 bg-paper-deep/60 shadow-xs"
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className={`sheet-shadow relative border border-rule bg-paper-soft transition-all duration-500 hover:border-rule/90 ${
          isSubmittingAnim ? "scale-[0.985] opacity-80" : ""
        }`}
      >
        {/* 信笺头部 */}
        <div className="px-6 pt-6 md:px-9">
          <div className="flex items-center justify-between font-hei text-[11px] tracking-[0.22em] text-ink-faint">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-seal" />
              <span>呈 · 收信人</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-song tracking-[0.14em] text-ink-faint/80">
                {formatMonth()}
              </span>
              <WaxSeal character={selectedSeal} size="sm" className="hidden sm:inline-flex" />
            </div>
          </div>
          <div className="mt-3.5 h-px bg-rule" />
        </div>

        {/* 输入区域：横格铺满整张纸，便签浮于其上。
            写入后便签只淡出、不移除，纸面高度自始至终不变。 */}
        <div className="px-6 md:px-9">
          <div className="relative pt-2">
            <div
              className="ruled-field pointer-events-none absolute inset-0"
              aria-hidden="true"
            />

            <label className="sr-only" htmlFor="letter-body">
              你的信件内容
            </label>
            <textarea
              ref={textareaRef}
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
              placeholder="有何见问？不必斟酌字句，如实写下便好…"
              className="relative block w-full resize-none bg-transparent pb-1 pt-[10px] font-kai text-[17.5px] leading-[34px] text-ink outline-none placeholder:font-kai placeholder:text-ink-faint/50"
            />

            {/* 灵感便签条：常驻占位，仅淡出 */}
            <div
              className={`relative pb-2 transition-opacity duration-500 ${
                count === 0
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              inert={count > 0}
            >
              <PromptChips onSelectPrompt={handleSelectPrompt} />
            </div>
          </div>
        </div>

        {/* 印章主题微选 */}
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-rule/70 px-6 py-2.5 md:px-9">
          <div className="flex items-center gap-1.5 font-hei text-[10.5px] tracking-wider text-ink-faint">
            <span>钤一枚闲印：</span>
            <div className="flex items-center gap-1">
              {SEAL_OPTIONS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => setSelectedSeal(char)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-kai text-[11px] transition-all ${
                    selectedSeal === char
                      ? "bg-seal text-paper-soft shadow-xs scale-105"
                      : "text-ink-faint hover:bg-paper-deep/50 hover:text-ink"
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <span
            className={`font-mono text-[10.5px] transition-colors ${
              count > MAX_BODY * 0.9 ? "text-seal font-medium" : "text-ink-faint/80"
            }`}
          >
            {count}/{MAX_BODY}
          </span>
        </div>

        {/* 底部署名与投递按钮栏 */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-t border-rule bg-paper/30 px-6 py-4 md:px-9">
          <label className="flex items-center gap-2">
            <span className="font-hei text-[11px] tracking-[0.2em] text-ink-faint">
              落款
            </span>
            <input
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="留白即隐名"
              autoComplete="off"
              className="w-28 border-b border-rule bg-transparent pb-0.5 font-kai text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint/50 focus:border-seal/70"
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="hidden font-hei text-[10px] tracking-wider text-ink-faint/70 lg:inline">
              ⌘ + Enter 投函
            </span>
            <button
              type="submit"
              disabled={pending || isSubmittingAnim || count === 0}
              className="group relative flex items-center gap-2 overflow-hidden bg-seal px-7 py-2.5 font-hei text-[12px] tracking-[0.3em] text-paper-soft shadow-[inset_0_0_0_1px_rgba(251,247,238,0.22)] transition-all duration-300 hover:bg-[#9d3125] hover:shadow-[0_4px_16px_-4px_rgba(178,58,44,0.4)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-rule disabled:text-ink-faint disabled:shadow-none"
            >
              {isSubmittingAnim || pending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  <span>缄封中…</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>投 函</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 蜜罐防垃圾 */}
        <div className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
          <label>
            网站
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* 错误提示 */}
        {state.status === "error" && (
          <p
            role="status"
            className="fade-up border-t border-seal/20 bg-seal/[0.04] px-6 py-3 font-kai text-[12.5px] text-seal md:px-9"
          >
            {state.message}
          </p>
        )}

        {/* 投递成功状态：高质感收执凭证 */}
        {done && (
          <div className="modal-backdrop absolute inset-0 z-20 flex flex-col items-center justify-center bg-paper-soft/95 px-8 py-10 text-center backdrop-blur-xs">
            {/* 投递凭据卡片 */}
            <div className="modal-card sheet-shadow relative w-full max-w-[340px] border border-rule/80 bg-paper-soft p-6">
              <div className="pointer-events-none absolute inset-2 border border-seal/20" />

              <div className="flex items-center justify-between">
                <CancellationMark date="2026.11" location="已入箱" className="scale-75" />
                <WaxSeal character={selectedSeal} size="md" className="seal-drop" />
              </div>

              <div className="my-5 border-y border-dashed border-seal/40 py-2.5 font-song text-[22px] tracking-[0.35em] text-seal">
                已 投 函
              </div>

              <p className="font-kai text-[13.5px] leading-[1.9] text-ink-soft">
                此函已入信筒。
                <br />
                必逐封细读，徐徐作复。
              </p>

              <div className="mt-6 flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={writeAnother}
                  className="bg-seal py-2 font-hei text-[11px] tracking-[0.25em] text-paper-soft transition-colors hover:bg-[#9d3125] shadow-xs active:translate-y-px"
                >
                  再 修 一 笺
                </button>
                <a
                  href="#letters"
                  className="font-hei text-[10.5px] tracking-[0.18em] text-ink-faint hover:text-seal transition-colors"
                >
                  往 信 箱 观 他 人 回 音 ↓
                </a>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
