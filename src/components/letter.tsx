"use client";

import { Maximize2, Share, Sparkle } from "lucide-react";
import { useState } from "react";
import { formatDay, formatFullDate } from "@/lib/format";
import type { Question } from "@/lib/types";
import { ShareModal } from "./share-modal";
import { PostageStamp, Postmark, stampOf } from "./stamp-badge";
import { showToast } from "./toast";

interface Spark {
  id: number;
  x: number;
}

export function Letter({
  q,
  number,
  active = true,
  resonated: controlledResonated,
  onResonate,
  onOpenFull,
}: {
  q: Question;
  number: number;
  index?: number;
  active?: boolean;
  resonated?: boolean;
  onResonate?: () => void;
  onOpenFull?: (q: Question) => void;
}) {
  const [localResonated, setLocalResonated] = useState(false);
  const resonated = controlledResonated ?? localResonated;
  const baseCount =
    Math.abs(
      q.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 24,
    ) + 6;
  const resonanceCount = baseCount + (resonated ? 1 : 0);
  const [shareOpen, setShareOpen] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // 依据信件唯一 id 确定性推算专属邮票与印色
  const stamp = stampOf(q.id);

  const handleResonate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!resonated) {
      if (onResonate) onResonate();
      else setLocalResonated(true);

      const newSparks: Spark[] = [
        { id: Date.now() + 1, x: -14 },
        { id: Date.now() + 2, x: 2 },
        { id: Date.now() + 3, x: 16 },
      ];
      setSparks(newSparks);
      setTimeout(() => setSparks([]), 900);

      showToast("微光相应，温意渐起");
    }
  };

  return (
    <>
      <article
        className={`sheet group relative flex h-full flex-col overflow-hidden bg-paper/95 px-6 py-6 transition-all duration-400 md:px-7 md:py-7 ${
          active
            ? "border-seal/40 shadow-[0_18px_38px_-22px_rgba(28,25,23,0.28)]"
            : "border-rule/80 hover:border-seal/35"
        }`}
      >
        {/* 顶边朱砂细眉：滑入画心中央或悬停时微微显出 */}
        <span
          className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-linear-to-r from-seal/55 via-seal/20 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,0.68,0.25,1)] ${
            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-75"
          }`}
          aria-hidden="true"
        />

        {/* 顶部元信息栏与邮戳徽章 */}
        <div className="relative flex items-start justify-between gap-4 border-b border-rule/50 pb-4">
          <div className="flex flex-col gap-1.5 font-hei text-[11px] tracking-[0.2em] text-ink-faint">
            <div className="flex items-center gap-2.5">
              {q.status === "pending" ? (
                <span className="font-kai text-[11.5px] tracking-[0.18em] text-seal">
                  私 函
                </span>
              ) : (
                <span className="font-mono text-[12px] font-medium text-ink">
                  NO.{String(number).padStart(3, "0")}
                </span>
              )}
              <span className="h-2.5 w-px bg-rule" />
              <time dateTime={q.createdAt}>{formatDay(q.createdAt)}</time>
            </div>

            <div className="flex items-center gap-2">
              {q.status === "pending" ? (
                <span className="inline-flex items-center gap-1 font-kai text-[11px] text-seal">
                  <span className="h-1.5 w-1.5 rounded-full bg-seal/75" />
                  候复 · 仅你可见
                </span>
              ) : q.answer ? (
                <span className="inline-flex items-center gap-1 font-kai text-[11px] text-pine">
                  <span className="h-1.5 w-1.5 rounded-full bg-pine/80" />
                  已 复
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-kai text-[11px] text-ink-faint">
                  <span className="h-1.5 w-1.5 rounded-full bg-rule" />
                  候 复
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-102">
            <Postmark
              id={q.id}
              place="尺素"
              date={
                q.createdAt
                  ? q.createdAt.slice(0, 7).replace("-", ".")
                  : "2026.11"
              }
              className="hidden scale-75 sm:block"
            />
            <PostageStamp
              theme={stamp.theme}
              color={stamp.color}
              price={stamp.price}
              size="sm"
              className="shadow-xs transition-transform duration-300 group-hover:-rotate-2"
            />
          </div>
        </div>

        {/* 信件正文 + 回信（随 470px 卡片定高自适应撑满，长信内部顺滑纵滚；点击可案头取笺精读） */}
        <div className="handscroll-body relative mt-5 min-h-0 flex-1 overflow-y-auto pr-1.5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenFull?.(q)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenFull?.(q);
              }
            }}
            className="group/link block cursor-pointer"
          >
            <p className="whitespace-pre-wrap font-kai text-[19.5px] leading-[1.9] text-ink transition-colors duration-300 group-hover/link:text-seal md:text-[21.5px]">
              {q.body}
            </p>
          </div>

          <p className="mt-3.5 text-right font-kai text-[13px] text-ink-faint">
            —— {q.nickname || "匿名旅人"}
          </p>

          {q.answer ? (
            <div className="mt-6 border-t border-dashed border-rule/90 pt-5">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-seal/50 font-kai text-[11.5px] leading-none text-seal shadow-xs">
                  答
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="whitespace-pre-wrap font-song text-[15.5px] leading-[2.12] text-ink-soft md:text-[16px]">
                    {q.answer}
                  </p>
                  {q.answeredAt && (
                    <p className="font-hei text-[11px] tracking-wider text-ink-faint">
                      复于 {formatFullDate(q.answeredAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 border-t border-dashed border-rule/50 pt-3.5">
              <p className="font-kai text-[12px] text-ink-faint">
                此函尚在箧中，俟收信人展读，徐徐作复。
              </p>
            </div>
          )}
        </div>

        {/* 底部操作与微互动 */}
        {q.status === "pending" ? (
          <div className="relative mt-6 flex items-center justify-between gap-2 border-t border-rule/60 pt-4">
            <p className="font-kai text-[11.5px] text-ink-faint">
              此函仅君可见。待收信人作复，自当示人。
            </p>
            {onOpenFull && (
              <button
                type="button"
                onClick={() => onOpenFull(q)}
                className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap font-hei text-[11px] tracking-wider text-ink-faint transition-colors duration-300 hover:text-seal"
              >
                <Maximize2 className="h-3 w-3" strokeWidth={1.8} />
                <span>取笺精读</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-rule/60 pt-4">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* 微光按钮 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleResonate}
                  title="寄一抹微光"
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
                  <span className="hidden sm:inline">微光</span>
                </button>

                {sparks.map((spark) => (
                  <span
                    key={spark.id}
                    className="spark-rise pointer-events-none absolute left-1/2 top-0 h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]"
                    style={{ "--spark-x": `${spark.x}px` } as React.CSSProperties}
                  />
                ))}
              </div>

              {/* 分享 / 生成信笺按钮 */}
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-hei text-[11px] text-ink-faint transition-colors hover:bg-paper-deep/40 hover:text-ink active:scale-95"
              >
                <Share className="h-3.5 w-3.5" strokeWidth={1.8} />
                <span>传 阅</span>
              </button>
            </div>

            {onOpenFull && (
              <button
                type="button"
                onClick={() => onOpenFull(q)}
                className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap font-hei text-[11px] tracking-wider text-ink-faint transition-colors duration-300 hover:text-seal"
              >
                <Maximize2 className="h-3 w-3" strokeWidth={1.8} />
                <span>取笺精读</span>
              </button>
            )}
          </div>
        )}
      </article>

      {/* 分享弹窗 */}
      {q.status === "published" && (
        <ShareModal
          question={q}
          number={number}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
