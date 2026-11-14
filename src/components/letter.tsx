import Link from "next/link";
import { formatDay } from "@/lib/format";
import type { Question } from "@/lib/store";

export function Letter({
  q,
  number,
  index = 0,
}: {
  q: Question;
  number: number;
  index?: number;
}) {
  return (
    <article
      className="reveal group"
      style={{ animationDelay: `${Math.min(index, 5) * 80}ms` }}
    >
      <div className="flex items-center gap-3 font-hei text-[10px] tracking-[0.24em] text-ink-faint">
        <span className="font-mono tracking-normal text-ink-faint/90">
          No.{String(number).padStart(3, "0")}
        </span>
        <span className="h-px flex-1 bg-rule" />
        <time dateTime={q.createdAt}>{formatDay(q.createdAt)}</time>
      </div>

      <Link href={`/q/${q.id}`} className="block">
        <p className="mt-6 font-kai text-[20px] leading-[1.9] text-ink transition-colors duration-300 group-hover:text-seal md:text-[22px]">
          {q.body}
        </p>
      </Link>

      {q.nickname ? (
        <p className="mt-3 text-right font-kai text-[12px] text-ink-faint">
          —— {q.nickname}
        </p>
      ) : null}

      {q.answer ? (
        <div className="mt-7 flex gap-4">
          <span className="mt-[7px] flex h-6 w-6 shrink-0 items-center justify-center border border-seal/45 font-kai text-[11px] leading-none text-seal">
            答
          </span>
          <p className="whitespace-pre-wrap font-song text-[15.5px] leading-[2.05] text-ink-soft md:text-[16px]">
            {q.answer}
          </p>
        </div>
      ) : (
        <p className="mt-7 pl-10 font-kai text-[12px] text-ink-faint/70">
          尚未回信。
        </p>
      )}
    </article>
  );
}
