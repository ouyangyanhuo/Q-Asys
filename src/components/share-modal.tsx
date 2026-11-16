"use client";

import { Copy, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import { formatFullDate, letterNo } from "@/lib/format";
import { Modal } from "./modal";
import { PostageStamp, Postmark, Seal, stampOf } from "./stamp-badge";

interface ShareModalProps {
  question: Question;
  number?: number;
  isOpen: boolean;
  onClose: () => void;
}

/** 抄录结果的短提示：弹层内不用 toast，改在按钮旁给一行字 */
function useCopyHint() {
  const [hint, setHint] = useState("");
  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(""), 2000);
    return () => window.clearTimeout(timer);
  }, [hint]);
  return [hint, setHint] as const;
}

export function ShareModal({ question, number, isOpen, onClose }: ShareModalProps) {
  const stamp = stampOf(question.id);
  const [hint, setHint] = useCopyHint();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(url).then(() => setHint("专笺之址已录"));
  };

  const handleCopyText = () => {
    const text = `【尺素】\n问：${question.body}${question.nickname ? ` —— ${question.nickname}` : ""}\n${question.answer ? `\n答：${question.answer}\n` : ""}\n原笺：${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(text).then(() => setHint("笺中文字已录"));
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy="share-modal-heading"
      width="35rem"
    >
      <div className="sheet frame relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
        {/* 顶部信头 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2
              id="share-modal-heading"
              className="font-song text-small tracking-[0.24em] text-ink"
            >
              尺素 · 笺谱留真
            </h2>
            <span className="font-kai text-[11px] text-ink-faint">
              {number ? letterNo(number) : "存 档 之 笺"}
              <span className="mx-2 text-rule">·</span>
              {formatFullDate(question.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Postmark
              place="尺素"
              date={question.createdAt.slice(0, 7).replace("-", ".")}
              className="hidden scale-75 sm:block"
            />
            <PostageStamp
              theme={stamp.theme}
              color={stamp.color}
              price={stamp.price}
              size="sm"
            />
          </div>
        </div>

        {/* 信件问题内容 */}
        <div className="my-8">
          <p className="font-kai text-letter leading-[1.88] text-ink">
            {question.body}
          </p>
          <p className="mt-3.5 text-right font-kai text-label text-ink-faint">
            —— {question.nickname || "匿名旅人"}
          </p>
        </div>

        {/* 回信部分 */}
        {question.answer && (
          <div className="border-t border-dashed border-rule pt-6">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-6 shrink-0 items-center justify-center border border-seal/50 font-kai text-[11px] text-seal">
                答
              </span>
              <p className="reply whitespace-pre-wrap font-song text-small text-ink-soft">
                {question.answer}
              </p>
            </div>
          </div>
        )}

        {/* 底部邮印水印 */}
        <div className="mt-8 flex items-center justify-between border-t border-rule pt-4 font-hei text-[11px] text-ink-faint">
          <span>有些话，不必署名。</span>
          <div className="flex items-center gap-2">
            <Seal text="信" size="1.75rem" />
            <span>尺素 · 永久存留</span>
          </div>
        </div>
      </div>

      {/* 操作栏：抄录结果就地以文字回应，读屏也能听见 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopyLink} className="btn btn-line btn-sm">
            <Link2 className="size-3.5" />
            录专属之址
          </button>
          <button type="button" onClick={handleCopyText} className="btn btn-line btn-sm">
            <Copy className="size-3.5" />
            录其文字
          </button>
          <span role="status" className="font-kai text-[11px] text-seal">
            {hint}
          </span>
        </div>

        <button type="button" onClick={onClose} className="btn btn-sm text-ink-faint">
          掩 卷
        </button>
      </div>
    </Modal>
  );
}
