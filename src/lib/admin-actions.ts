"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, requireAdmin } from "@/lib/auth";
import { MAX_ANSWER, publishAnswer, setStatus } from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";

/** 只接受合法 UUID，避免畸形 id 直接打到 Postgres 的 uuid 解析上 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveAnswerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  const answer = sanitizeText(String(formData.get("answer") ?? ""), {
    maxLength: MAX_ANSWER,
  });
  if (!answer.ok) return;

  await publishAnswer(id, answer.value);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function publishAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  await setStatus(id, "published");
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function hideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;

  await setStatus(id, "hidden");
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
