import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth";
import { requestOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = requestOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/admin/login?error=${reason}`);

  const store = await cookies();
  const expected = store.get("qa_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) return fail("state");
  if (code.length > 128) return fail("exchange");

  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  if (!clientId || !clientSecret) return fail("unconfigured");

  let accessToken: string | undefined;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      }),
      cache: "no-store",
    });
    if (!tokenRes.ok) return fail("exchange");
    const data = (await tokenRes.json()) as { access_token?: string };
    accessToken = data.access_token;
  } catch {
    return fail("exchange");
  }
  if (!accessToken) return fail("exchange");

  let login: string | undefined;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "letters-unsigned",
      },
      cache: "no-store",
    });
    if (!userRes.ok) return fail("exchange");
    const user = (await userRes.json()) as { login?: string };
    login = user.login;
  } catch {
    return fail("exchange");
  }
  if (!login) return fail("exchange");

  const allow = (process.env.ALLOWED_GITHUB_LOGIN ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  // 名单为空时不能「放行所有 GitHub 账号」——那就等于后台对全网开放。
  // 宁可登录失败，也要让配置缺失立刻暴露出来。
  if (allow.length === 0) {
    console.error(
      "[auth] ALLOWED_GITHUB_LOGIN is empty; refusing every login attempt",
    );
    return fail("unconfigured");
  }
  if (!allow.includes(login.toLowerCase())) {
    return fail("forbidden");
  }

  let token: string;
  try {
    token = await signSession(login);
  } catch (error) {
    // 典型原因：生产环境漏配 AUTH_SECRET。宁可登录失败，也不发一枚弱签名的令牌
    console.error("[auth] cannot sign session:", error);
    return fail("unconfigured");
  }

  const res = NextResponse.redirect(`${origin}/admin`);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  res.cookies.delete("qa_oauth_state");
  return res;
}
