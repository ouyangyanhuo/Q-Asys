import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 匿名访客的「认领凭据」。
 * 一枚随机 UUID 存在 httpOnly cookie 里，库里只存它的哈希——
 * 既不需要登录，也不留任何可反查身份的信息；代价是清掉 cookie 就找不回去了。
 */
export const VISITOR_COOKIE = "qa_visitor";
const MAX_AGE = 60 * 60 * 24 * 365;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function hashVisitor(id: string): string {
  const salt = process.env.IP_SALT ?? "local-salt";
  return createHash("sha256")
    .update(`${salt}:visitor:${id}`)
    .digest("hex")
    .slice(0, 32);
}

/** 只读，供页面使用（Server Component 不能写 cookie） */
export async function readVisitorHash(): Promise<string | null> {
  const store = await cookies();
  const id = store.get(VISITOR_COOKIE)?.value;
  return id && UUID.test(id) ? hashVisitor(id) : null;
}

/** 读不到就发一枚新的；只可在 Server Action 中调用 */
export async function ensureVisitorHash(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing && UUID.test(existing)) return hashVisitor(existing);

  const id = randomUUID();
  store.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return hashVisitor(id);
}
