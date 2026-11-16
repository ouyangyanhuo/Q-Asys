"use client";

import { Share, Sparkle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
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
  index = 0,
}: {
  q: Question;
  number: number;
  index?: number;
}) {
  const [resonated, setResonated] = useState(false);
  const [resonanceCount, setResonanceCount] = useState(
    Math.abs(q.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 24) + 6
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // 依据信件唯一 id 确定性推算专属邮票与印色
  const stamp = stampOf(q.id);

  const handleResonate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!resonated) {
      setResonated(true);
      setResonanceCount((prev) => prev + 1);

      // 产生向上漂浮消散的微光粒子
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
        className="rise group relative overflow-hidden border border-rule/80 bg-paper-soft/80 p-6 transition-all duration-400 hover:-translate-y-1 hover:border-seal/40 hover:bg-paper-soft hover:shadow-[0_18px_40px_-20px_rgba(28,25,23,0.18)] md:p-8"
        style={{ "--d": `${Math.min(index, 6) * 60}ms` } as React.CSSProperties}
      >
        {/* 信笺折角阴影暗纹 */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-10 w-10 bg-linear-to-bl from-paper-deep/70 via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* 顶部元信息栏与邮票徽章 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 font-hei text-[11px] tracking-[0.2em] text-ink-faint">
            <div className="flex items-center gap-2.5">
              {q.status === "pending" ? (
                <span className="font-kai text-[11px] tracking-[0.18em] text-seal">
                  私 函
                </span>
              ) : (
                <span className="font-mono text-[11.5px] font-medium text-ink-faint">
                  NO.{String(number).padStart(3, "0")}
                </span>
              )}
              <span className="h-2 w-px bg-rule" />
              <time dateTime={q.createdAt}>{formatDay(q.createdAt)}</time>
            </div>

            <div className="flex items-center gap-2">
              {q.status === "pending" ? (
                <span className="inline-flex items-center gap-1 font-kai text-[11px] text-seal">
                  <span className="h-1.5 w-1.5 rounded-full bg-seal/70" />
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

          {/* 右上角邮戳与迷你邮票：充满书信仪式感 */}
          <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-102">
            <Postmark
              place="尺素"
              date={q.createdAt ? q.createdAt.slice(0, 7).replace("-", ".") : "2026.11"}
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

        {/* 问询信件正文 */}
        <div className="mt-5">
          <Link
            href={q.status === "pending" ? `/p/${q.id}` : `/q/${q.id}`}
            className="block group/link"
          >
            <p className="font-kai text-[19px] leading-[1.88] text-ink transition-colors duration-300 group-hover/link:text-seal md:text-[21px]">
              {q.body}
            </p>
          </Link>

          {q.nickname ? (
            <p className="mt-3 text-right font-kai text-[12.5px] text-ink-faint">
              —— {q.nickname}
            </p>
          ) : (
            <p className="mt-3 text-right font-kai text-[11.5px] text-ink-faint">
              —— 匿名旅人
            </p>
          )}
        </div>

        {/* 回信区域 */}
        {q.answer ? (
          <div className="mt-6 border-t border-dashed border-rule/90 pt-5">
            <div className="flex items-start gap-3.5">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-seal/50 font-kai text-[11px] leading-none text-seal shadow-xs">
                答
              </span>
              <div className="space-y-1.5">
                <p className="whitespace-pre-wrap font-song text-[15px] leading-[2.1] text-ink-soft md:text-[15.5px]">
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

        {/* 底部操作与微互动：候复中的私函不参与共鸣与传阅 */}
        {q.status === "pending" ? (
          <div className="mt-7 border-t border-rule/60 pt-4">
            <p className="font-kai text-[11.5px] text-ink-faint">
              此函仅你可见。收信人作复之后，自会公开。
            </p>
          </div>
        ) : (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-rule/60 pt-4">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* 共鸣微光按钮 */}
            <div className="relative">
              <button
                type="button"
                onClick={handleResonate}
                title="送上一抹微光（共鸣）"
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 font-hei text-[11px] transition-all duration-300 ${
                  resonated
                    ? "bg-seal/10 text-seal font-medium shadow-xs"
                    : "text-ink-faint hover:bg-paper-deep/40 hover:text-ink active:scale-95"
                }`}
              >
                <Sparkle
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${resonated ? "scale-110 text-seal" : ""}`}
                  fill={resonated ? "currentColor" : "none"}
                  strokeWidth={1.8}
                />
                <span>{resonanceCount}</span>
                <span className="hidden sm:inline">共鸣</span>
              </button>

              {/* 微光漂浮升腾粒子 */}
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
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-hei text-[11px] text-ink-faint transition-colors hover:bg-paper-deep/40 hover:text-ink active:scale-95 whitespace-nowrap"
            >
              <Share className="h-3.5 w-3.5" strokeWidth={1.8} />
              <span>传 阅</span>
            </button>
          </div>

          <Link
            href={`/q/${q.id}`}
            className="ml-auto flex shrink-0 items-center gap-1 font-hei text-[11px] tracking-wider text-ink-faint transition-colors duration-300 hover:text-seal whitespace-nowrap"
          >
            <span>专属页</span>
            <span className="transition-transform duration-300 group-hover/arrow:translate-x-1">→</span>
          </Link>
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
