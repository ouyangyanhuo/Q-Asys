import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isDevOpen } from "@/lib/auth";

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
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[380px] text-center">
        <div className="relative mx-auto flex h-16 w-16 rotate-[-4deg] items-center justify-center border-2 border-seal font-kai text-[26px] leading-none text-seal">
          <span className="absolute inset-[5px] border border-seal/40" />
          <span className="relative">信</span>
        </div>

        <h1 className="mt-9 font-song text-[23px] tracking-[0.06em] text-ink">
          此页仅限收信人
        </h1>
        <p className="mt-4 font-kai text-[14px] leading-[2] text-ink-soft">
          登录之后，
          <br />
          才能读那些没有署名的信。
        </p>

        {message ? (
          <p className="mt-6 border-y border-seal/25 bg-seal/[0.04] px-4 py-3 font-kai text-[12.5px] text-seal">
            {message}
          </p>
        ) : null}

        <div className="mt-9">
          {configured ? (
            <a
              href="/api/auth/github"
              className="inline-block w-full bg-ink px-6 py-3 font-hei text-[12px] tracking-[0.22em] text-paper-soft transition-colors hover:bg-[#332e28]"
            >
              用 GitHub 登录
            </a>
          ) : (
            <div className="border border-dashed border-ink/20 px-5 py-5 text-left">
              <p className="font-hei text-[11px] tracking-[0.14em] text-ink-soft">
                尚未配置
              </p>
              <p className="mt-2 font-kai text-[12px] leading-[1.9] text-ink-faint">
                在 .env.local 里填上 AUTH_GITHUB_ID 与 AUTH_GITHUB_SECRET
                之后即可用 GitHub 登录。
              </p>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="mt-10 inline-block border-b border-ink/20 pb-0.5 font-hei text-[11px] tracking-[0.16em] text-ink-faint transition-colors hover:border-seal/50 hover:text-seal"
        >
          回到信箱
        </Link>
      </div>
    </main>
  );
}
