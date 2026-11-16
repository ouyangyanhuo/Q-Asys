import { Fingerprint } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isDevOpen } from "@/lib/auth";
import { Seal } from "@/components/stamp-badge";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  forbidden: "此 GitHub 名不在收信人之列。",
  state: "此间已逾时，烦请重来。",
  unconfigured: "尚未接通 GitHub，暂难验身。",
  exchange: "与 GitHub 相通未果，烦请重试。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (isDevOpen()) redirect("/admin");

  const session = await getSession();
  if (session) redirect("/admin");

  const { error } = await searchParams;
  const configured = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );
  const message = error ? (MESSAGES[error] ?? "验身未过。") : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      {/* 内边距要让开朱丝栏的两道线 */}
      <div className="sheet frame w-full max-w-[26rem] p-9 text-center md:p-12">
        <div className="flex justify-center">
          <Seal text="收信" size="3.25rem" tilt={-3} className="stamp-press" />
        </div>

        <h1 className="mt-6 font-song text-title tracking-[0.1em] text-ink">
          收信人工作台
        </h1>
        <p className="mt-3.5 font-kai text-body leading-[2] text-ink-soft">
          开启抽屉，
          <br />
          细读那些无需署名的心声与来信。
        </p>

        {message ? (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2.5 border border-seal/50 px-3.5 py-2.5 text-left font-kai text-small leading-[1.7] text-seal"
          >
            <span
              aria-hidden="true"
              className="mt-px flex-none border border-current px-1 font-song text-label leading-[1.6] font-bold"
            >
              误
            </span>
            <span>{message}</span>
          </p>
        ) : null}

        <div className="mt-8">
          {configured ? (
            <a
              href="/api/auth/github"
              className="btn w-full bg-ink text-paper-soft hover:bg-ink-soft"
            >
              <Fingerprint aria-hidden="true" className="size-4 flex-none" />
              {/* 西文不跟着汉字拉字距 */}
              <span>
                凭
                <span className="mr-[0.28em] tracking-[0.04em]">GitHub</span>
                验身入内
              </span>
            </a>
          ) : (
            <div className="border border-dashed border-ink-faint/50 px-5 py-4 text-left">
              <p className="font-hei text-label font-medium tracking-wider text-ink-soft">
                尚未配置 GITHUB OAUTH
              </p>
              <p className="mt-1.5 font-kai text-small leading-relaxed wrap-anywhere text-ink-faint">
                请在环境变量中填入 AUTH_GITHUB_ID 与 AUTH_GITHUB_SECRET。
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-rule pt-3">
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-1.5 font-song text-label tracking-[0.2em] text-ink-faint transition-colors hover:text-seal"
          >
            <span aria-hidden="true">←</span>
            归信箱
          </Link>
        </div>
      </div>
    </main>
  );
}
