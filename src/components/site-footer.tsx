import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import { Seal } from "./stamp-badge";
import { MotionToggle, ThemeToggle } from "./theme-toggle";

export function SiteFooter({
  maxWidth = "max-w-[1180px]",
}: {
  maxWidth?: string;
}) {
  return (
    <footer className="relative border-t border-rule/80 bg-paper-soft/50">
      <div className={`mx-auto ${maxWidth} px-5 py-10 md:px-10 md:py-12`}>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <Seal text="尺素" size="2.75rem" tilt={-3} />
            <div>
              <p className="font-kai text-body leading-relaxed text-ink-soft">
                凡落笔于此者，必细读之。
              </p>
              <p className="mt-1 max-w-[26em] font-song text-note leading-relaxed text-ink-faint">
                不必追问谁写下，只需知道曾有人这样思念与生活。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ThemeToggle />
            <MotionToggle />
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule/60 pt-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="group inline-flex min-h-9 items-center gap-1.5 font-song text-label tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
            >
              <span>收信人入内</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <a
              href="https://github.com/ouyangyanhuo/Q-Asys"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="在 GitHub 观其源"
              title="在 GitHub 观其源"
              className="flex h-9 w-9 items-center justify-center text-ink-faint transition-colors hover:text-seal"
            >
              <FaGithub className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <p className="font-mono text-micro tracking-[0.22em] text-ink-faint">
            MAGNETO © 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
