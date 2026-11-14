import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientId = process.env.AUTH_GITHUB_ID;
  const origin = requestOrigin(req);

  if (!clientId) {
    return NextResponse.redirect(`${origin}/admin/login?error=unconfigured`);
  }

  const state = randomBytes(16).toString("hex");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set(
    "redirect_uri",
    `${origin}/api/auth/github/callback`,
  );
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set("qa_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
