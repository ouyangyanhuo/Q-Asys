import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isDevOpen } from "@/lib/auth";
import { WaxSeal, CancellationMark } from "@/components/stamp-badge";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  forbidden: "这个 GitHub 账号不在收信人名单里。",
  state: "登录状态过期了，请再试一次。",
  unconfigured: "还没有配置 GitHub 登录。",
  exchange: "和 GitHub 通信失败，请再试一次。",
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
  const message = error ? (MESSAGES[error] ?? "登录没有成功。") : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="sheet-shadow relative w-full max-w-[420px] border border-rule bg-paper-soft p-8 text-center md:p-11">
        {/* 内框 */}
        <div className="pointer-events-none absolute inset-3 border border-seal/20" />

        <div className="flex items-center justify-between">
          <CancellationMark date="2026.11" location="收信" className="scale-75" />
          <WaxSeal character="信" size="md" />
        </div>

        <h1 className="mt-7 font-song text-[24px] tracking-[0.1em] text-ink">
          收信人工作台
        </h1>
        <p className="mt-3.5 font-kai text-[14.5px] leading-[2] text-ink-soft">
          开启抽屉，
          <br />
          细读那些无需署名的心声与来信。
        </p>

        {message ? (
          <p className="mt-6 border border-seal/30 bg-seal/[0.05] px-4 py-2.5 font-kai text-[12.5px] text-seal">
            {message}
          </p>
        ) : null}

        <div className="mt-8">
          {configured ? (
            <a
              href="/api/auth/github"
              className="inline-flex w-full items-center justify-center gap-2 bg-ink px-6 py-3 font-hei text-[12px] tracking-[0.22em] text-paper-soft shadow-xs transition-colors hover:bg-[#332e28] active:translate-y-px"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>通过 GitHub 认证登入</span>
            </a>
          ) : (
            <div className="border border-dashed border-ink/25 bg-paper/60 px-5 py-4 text-left">
              <p className="font-hei text-[11px] font-medium tracking-wider text-ink-soft">
                尚未配置 GITHUB OAUTH
              </p>
              <p className="mt-1.5 font-kai text-[12px] leading-relaxed text-ink-faint">
                请在环境变量中填入 AUTH_GITHUB_ID 与 AUTH_GITHUB_SECRET。
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-rule/60 pt-4">
          <Link
            href="/"
            className="font-hei text-[11px] tracking-[0.16em] text-ink-faint transition-colors hover:text-seal"
          >
            ← 返回信箱大厅
          </Link>
        </div>
      </div>
    </main>
  );
}
