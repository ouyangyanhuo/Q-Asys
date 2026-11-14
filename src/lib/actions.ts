"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  countRecentByIp,
  createQuestion,
  MAX_BODY,
  MAX_NICKNAME,
  RATE_LIMIT_PER_HOUR,
} from "@/lib/store";

export type SubmitState = {
  status: "idle" | "ok" | "error";
  message?: string;
  at?: number;
};

async function clientIpHash(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim() || store.get("x-real-ip") || "local";
  const salt = process.env.IP_SALT ?? "local-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function submitQuestion(
  formData: FormData,
): Promise<SubmitState> {
  const trap = String(formData.get("website") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawNickname = String(formData.get("nickname") ?? "").trim();
  const length = [...body].length;

  // 蜜罐命中：假装成功，不给对方任何反馈
  if (trap) return { status: "ok", at: Date.now() };
  if (length === 0) return { status: "error", message: "尚无一字。" };
  if (length > MAX_BODY) {
    return {
      status: "error",
      message: `至多 ${MAX_BODY} 字，请删减几分。`,
    };
  }

  const ipHash = await clientIpHash();
  const recent = await countRecentByIp(ipHash);
  if (recent >= RATE_LIMIT_PER_HOUR) {
    return { status: "error", message: "今日信箧已满，请稍后再投。" };
  }

  const nickname = rawNickname
    ? [...rawNickname].slice(0, MAX_NICKNAME).join("")
    : null;

  await createQuestion({ body, nickname, ipHash });
  revalidatePath("/admin");

  return { status: "ok", at: Date.now() };
}
