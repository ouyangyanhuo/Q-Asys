"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Share,
  Sparkle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatFullDate } from "@/lib/format";
import type { Question } from "@/lib/types";
import { Modal } from "./modal";
import { ShareModal } from "./share-modal";
import { PostageStamp, Postmark, Seal, stampOf } from "./stamp-badge";
import { showToast } from "./toast";

interface Spark {
  id: number;
  x: number;
}

interface LetterReadModalProps {
  question: Question | null;
  number: number;
  resonated: boolean;
  onResonate: () => void;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

/**
 * 案头取笺：在首页画卷上点选某封信时，将此笺轻提至案头正中展开全篇精读。
 * 地址栏同步为 /q/[id]（或 /p/[id]），合上弹层后落回画卷原位，进度丝毫不丢。
 */
export function LetterReadModal({
  question,
  number,
  resonated,
  onResonate,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: LetterReadModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    setCopied(false);
  }, [question?.id]);

  // 精读弹层打开时，左右方向键直接翻阅前后信笺
  useEffect(() => {
    if (!question || shareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, shareOpen, hasPrev, hasNext, onPrev, onNext]);

  const stamp = question ? stampOf(question.id) : null;
  const baseCount = question
    ? Math.abs(
        question.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 24,
      ) + 6
    : 0;
  const resonanceCount = baseCount + (resonated ? 1 : 0);

  const handleResonate = () => {
    if (resonated) return;
    onResonate();
    const newSparks: Spark[] = [
      { id: Date.now() + 1, x: -14 },
      { id: Date.now() + 2, x: 2 },
      { id: Date.now() + 3, x: 16 },
    ];
    setSparks(newSparks);
    setTimeout(() => setSparks([]), 900);
    showToast("微光相应，温意渐起");
  };

  const handleCopyLink = async () => {
    if (!question) return;
    const path =
      question.status === "pending" ? `/p/${question.id}` : `/q/${question.id}`;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("专属信笺链接已抄录");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("未能写入剪贴板，请直接复制地址栏");
    }
  };

  return (
    <>
      <Modal
        open={Boolean(question)}
        onClose={onClose}
        label="案头展读全笺"
        width="48rem"
      >
        {question && stamp && (
          <article className="sheet frame relative overflow-hidden px-6 py-7 md:px-12 md:py-11">
            {/* 八行笺内框装饰 */}
            <div
              className="pointer-events-none absolute inset-3 border border-seal/15"
              aria-hidden="true"
            />

            {/* 顶部元信息 + 放回画卷 */}
            <div className="relative flex items-center justify-between gap-4 border-b border-rule/70 pb-4">
              <div className="flex flex-wrap items-center gap-2.5 font-hei text-[11px] tracking-[0.2em] text-ink-faint">
                {question.status === "pending" ? (
                  <span className="font-kai text-[12px] text-seal">私 函</span>
                ) : (
                  <span className="font-mono text-[12px] font-medium text-ink">
                    NO.{String(number).padStart(3, "0")}
                  </span>
                )}
                <span className="h-2.5 w-px bg-rule" />
                <time dateTime={question.createdAt}>
                  {formatFullDate(question.createdAt)}
                </time>
                <span className="h-2.5 w-px bg-rule" />
                {question.status === "pending" ? (
                  <span className="font-kai text-seal">候复 · 仅你可见</span>
                ) : question.answer ? (
                  <span className="font-kai text-pine">已 复</span>
                ) : (
                  <span className="font-kai">候 复</span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex shrink-0 items-center gap-1.5 border border-rule/80 bg-paper/75 px-3 py-1 font-hei text-[11px] tracking-[0.16em] text-ink-soft transition-colors hover:border-seal/55 hover:text-seal"
              >
                <span>放回画卷</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 正文与邮品 */}
            <div className="relative mt-7">
              <div className="float-right mb-3 ml-4 flex items-center gap-2">
                <Postmark
                  id={question.id}
                  place="尺素"
                  date={
                    question.createdAt
                      ? question.createdAt.slice(0, 7).replace("-", ".")
                      : "2026.11"
                  }
                  className="hidden scale-85 sm:block"
                />
                <PostageStamp
                  theme={stamp.theme}
                  color={stamp.color}
                  price={stamp.price}
                  size="sm"
                  className="shadow-xs"
                />
              </div>

              <p className="whitespace-pre-wrap font-kai text-[21px] leading-[1.92] text-ink md:text-[24px]">
                {question.body}
              </p>

              <p className="clear-both mt-4 text-right font-kai text-[13px] text-ink-faint">
                —— {question.nickname || "匿名旅人"}
              </p>
            </div>

            {question.status === "pending" && (
              <div className="relative mt-7 border border-dashed border-seal/35 bg-seal/[0.035] px-4 py-3 font-kai text-[12.5px] leading-relaxed text-ink-soft">
                此函尚在候复，只有你自己看得见。收信人展读之后，回音会补在此处，旁人便可读到。
              </div>
            )}

            {/* 完整回信区域（不受 470px 限制，长信一气呵成） */}
            <div className="relative mt-8 border-t border-dashed border-rule/90 pt-7">
              {question.answer ? (
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-seal/50 font-kai text-[12px] leading-none text-seal shadow-xs">
                    答
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="whitespace-pre-wrap font-song text-[16px] leading-[2.16] text-ink-soft md:text-[17px]">
                      {question.answer}
                    </p>
                    {question.answeredAt && (
                      <p className="font-hei text-[11px] tracking-[0.16em] text-ink-faint">
                        复于 {formatFullDate(question.answeredAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-rule" />
                  <p className="font-kai text-[13.5px] text-ink-faint">
                    此函尚在箧中，待收信人展读，徐徐作复。
                  </p>
                </div>
              )}
            </div>

            {/* 底部操作与署印 + 案头连读上下封 */}
            <div className="relative mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-rule/70 pt-5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Seal text="信" variant="yin" size="2.2rem" />

                {question.status === "published" && (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleResonate}
                        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 font-hei text-[11px] transition-all duration-300 ${
                          resonated
                            ? "bg-seal/10 font-medium text-seal shadow-xs"
                            : "text-ink-faint hover:bg-paper-deep/40 hover:text-ink active:scale-95"
                        }`}
                      >
                        <Sparkle
                          className={`h-3.5 w-3.5 transition-transform duration-300 ${resonated ? "scale-110 text-seal" : ""}`}
                          fill={resonated ? "currentColor" : "none"}
                          strokeWidth={1.8}
                        />
                        <span>{resonanceCount}</span>
                        <span>微光</span>
                      </button>

                      {sparks.map((spark) => (
                        <span
                          key={spark.id}
                          className="spark-rise pointer-events-none absolute left-1/2 top-0 h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]"
                          style={{ "--spark-x": `${spark.x}px` } as React.CSSProperties}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShareOpen(true)}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 font-hei text-[11px] text-ink-faint transition-colors hover:bg-paper-deep/40 hover:text-ink"
                    >
                      <Share className="h-3.5 w-3.5" strokeWidth={1.8} />
                      <span>传 阅</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 font-hei text-[11px] text-ink-faint transition-colors hover:bg-paper-deep/40 hover:text-ink"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-pine" strokeWidth={2} />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  <span>{copied ? "已抄录" : "复制链接"}</span>
                </button>
              </div>

              {(onPrev || onNext) && (
                <div className="ml-auto flex items-center gap-1.5 font-hei text-[11px]">
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={!hasPrev}
                    title="上一封（←）"
                    className="inline-flex items-center gap-0.5 border border-rule/80 bg-paper/70 px-2.5 py-1 tracking-wider text-ink-soft transition-colors hover:border-seal/50 hover:text-seal disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>上一封</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!hasNext}
                    title="下一封（→）"
                    className="inline-flex items-center gap-0.5 border border-rule/80 bg-paper/70 px-2.5 py-1 tracking-wider text-ink-soft transition-colors hover:border-seal/50 hover:text-seal disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <span>下一封</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </article>
        )}
      </Modal>

      {question && question.status === "published" && (
        <ShareModal
          question={question}
          number={number}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
