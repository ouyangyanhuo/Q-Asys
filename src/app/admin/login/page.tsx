import { Fingerprint } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isDevOpen } from "@/lib/auth";
import { WaxSeal, CancellationMark } from "@/components/stamp-badge";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  forbidden: "此 GitHub 名不在收信人之列。",
  state: "登录已逾时，请再试。",
  unconfigured: "尚未配置 GitHub 登录。",
  exchange: "与 GitHub 相通失败，请再试。",
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
              <Fingerprint className="h-4 w-4" />
              <span>凭 GitHub 验身入内</span>
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
            ← 归 信 箱
          </Link>
        </div>
      </div>
    </main>
  );
}
