"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rejectMessage, sanitizeText, type RejectCode } from "@/lib/sanitize";
import { checkRate, waitPhrase } from "@/lib/rate-limit";
import { ensureVisitorHash } from "@/lib/visitor";
import { createQuestion, MAX_BODY, MAX_NICKNAME } from "@/lib/store";

export type SubmitErrorCode =
  | "empty"
  | "too_long"
  | "control_chars"
  | "unsafe_markup"
  | "unsafe_sql"
  | "rate_limited"
  | "storage";

export type SubmitState = {
  status: "idle" | "ok" | "error";
  code?: SubmitErrorCode;
  message?: string;
  /** 限流时给出的冷却秒数，供前端做倒计时 */
  retryAfter?: number;
  at?: number;
};

const CODE_MAP: Record<RejectCode, SubmitErrorCode> = {
  empty: "empty",
  too_long: "too_long",
  control: "control_chars",
  markup: "unsafe_markup",
  script: "unsafe_markup",
  sql: "unsafe_sql",
};

function rejected(code: RejectCode, maxLength: number): SubmitState {
  return {
    status: "error",
    code: CODE_MAP[code],
    message: rejectMessage(code, maxLength),
  };
}

/**
 * 只哈希、不留明文。Vercel 会覆写 x-forwarded-for，取最左一段即真实来源；
 * 取不到时用常量兜底，让同一台机器仍然受同一份额度约束。
 */
async function clientIpHash(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim().slice(0, 64) ||
    store.get("x-real-ip")?.slice(0, 64) ||
    "unknown";
  const salt = process.env.IP_SALT ?? "local-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function submitQuestion(
  formData: FormData,
): Promise<SubmitState> {
  // 蜜罐：真人看不见这个字段，命中的一律当作机器，假装成功、不留任何记录
  const trap = String(formData.get("website") ?? "").trim();
  if (trap) return { status: "ok", at: Date.now() };

  // 1. 净化正文
  const body = sanitizeText(String(formData.get("body") ?? ""), {
    maxLength: MAX_BODY,
  });
  if (!body.ok) {
    console.warn("[submit:rejected]", body.code);
    return rejected(body.code, MAX_BODY);
  }

  // 2. 净化落款（单行、更短）
  const rawNickname = String(formData.get("nickname") ?? "").trim();
  let nickname: string | null = null;
  if (rawNickname) {
    const nick = sanitizeText(rawNickname, {
      maxLength: MAX_NICKNAME,
      singleLine: true,
    });
    if (!nick.ok) {
      console.warn("[submit:rejected]", `nickname:${nick.code}`);
      return rejected(nick.code, MAX_NICKNAME);
    }
    nickname = nick.value;
  }

  // 3. 限流：短窗 + 长窗 + 全站，任一超限即拒
  const ipHash = await clientIpHash();
  const verdict = await checkRate(`ip:${ipHash}`);
  if (!verdict.allowed) {
    console.warn("[submit:rate_limited]", verdict.rule?.key, verdict.hits);
    return {
      status: "error",
      code: "rate_limited",
      retryAfter: verdict.retryAfter,
      message: `今日信箧已满，${waitPhrase(verdict.retryAfter)}。`,
    };
  }

  // 4. 落库（参数化写入，不拼 SQL）
  // 认领凭据：一枚匿名 cookie，让投信人之后还能找到自己这封候复中的信
  const visitorHash = await ensureVisitorHash();

  try {
    await createQuestion({ body: body.value, nickname, ipHash, visitorHash });
  } catch (error) {
    console.error("[submit:storage]", error);
    return {
      status: "error",
      code: "storage",
      message: "落笔未能入箱，请稍后再试。",
    };
  }

  revalidatePath("/admin");
  return { status: "ok", at: Date.now() };
}
