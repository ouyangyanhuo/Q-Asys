import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * 来访者的匿名指纹：只哈希，不留明文。
 *
 * 取值优先级：x-real-ip（Vercel 写入的可信来源）→ X-Forwarded-For 的**最后一段**。
 * 不能取最左段：那一段可能由客户端自行带上，伪造它就能绕过按 IP 的限流。
 */
export async function clientIpHash(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for") ?? "";
  const ip =
    store.get("x-real-ip")?.slice(0, 64) ||
    forwarded.split(",").pop()?.trim().slice(0, 64) ||
    "unknown";

  const salt = process.env.IP_SALT ?? "local-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
