import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "qa_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export function isDevOpen(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.AUTH_GITHUB_ID;
}

const DEV_SECRET = "local-development-secret-change-me-please";

async function key(): Promise<Uint8Array> {
  const raw = process.env.AUTH_SECRET;
  if (!raw && process.env.NODE_ENV === "production") {
    // 绝不回落到仓库里的公开串：那等于把管理员令牌的签名钥匙交出去
    throw new Error(
      "AUTH_SECRET 未配置：生产环境拒绝签发或校验会话（本地开发仍可用默认值）",
    );
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw ?? DEV_SECRET),
  );
  return new Uint8Array(digest);
}

export async function signSession(login: string): Promise<string> {
  return new SignJWT({ login })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(await key());
}

export async function createSession(login: string): Promise<void> {
  const token = await signSession(login);
  const store = await cookies();
  store.set(COOKIE, token, sessionCookieOptions);
}

export async function getSession(): Promise<{ login: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await key());
    return { login: String(payload.login ?? "") };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function requireAdmin(): Promise<void> {
  if (isDevOpen()) return;
  const session = await getSession();
  if (!session) redirect("/admin/login");
}
