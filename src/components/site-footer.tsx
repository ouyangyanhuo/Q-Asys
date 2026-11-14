import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteFooter({
  maxWidth = "max-w-[1180px]",
}: {
  maxWidth?: string;
}) {
  return (
    <footer className="border-t border-rule/80 bg-paper-soft/40">
      <div className={`mx-auto ${maxWidth} px-6 py-10 md:px-10`}>
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-kai text-[14px] leading-relaxed text-ink-soft">
              凡落笔于此者，必细读之。
            </p>
            <p className="mt-1.5 font-hei text-[10.5px] leading-relaxed tracking-wider text-ink-faint">
              不必追问谁写下，只需知道曾有人这样思念与生活。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle placement="top" />
            <Link
              href="/admin"
              className="group flex items-center gap-2 border border-rule bg-paper px-4 py-2 font-hei text-[11px] tracking-[0.2em] text-ink-soft transition-colors hover:border-seal/50 hover:text-seal"
            >
              <span>收信人入内</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-4 border-t border-rule/60 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <p className="font-hei text-[10px] tracking-[0.24em] text-ink-faint">
              - 尺素
            </p>
          </div>
          <p className="font-mono text-[9px] tracking-[0.22em] text-ink-faint/70">
            MAGNETO © 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
