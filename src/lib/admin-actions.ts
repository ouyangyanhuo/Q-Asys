"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, requireAdmin } from "@/lib/auth";
import {
  isAcceptableId,
  MAX_ANSWER,
  publishAnswer,
  setStatus,
} from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";

export type ReplyState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** 每次落笔的时间戳，前端据此判断「又成功了一次」 */
  at?: number;
};

export async function saveAnswerAction(
  _previous: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!isAcceptableId(id)) {
    return { status: "error", message: "未能认出这封信。" };
  }

  const answer = sanitizeText(String(formData.get("answer") ?? ""), {
    maxLength: MAX_ANSWER,
  });
  if (!answer.ok) {
    return { status: "error", message: "回函内容不合规，请再改一改。" };
  }

  await publishAnswer(id, answer.value);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/q/${id}`);

  return {
    status: "ok",
    message: "回函已送出，前台即刻可见。",
    at: Date.now(),
  };
}

export async function publishAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isAcceptableId(id)) return;

  await setStatus(id, "published");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/q/${id}`);
}

export async function hideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isAcceptableId(id)) return;

  await setStatus(id, "hidden");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/q/${id}`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
