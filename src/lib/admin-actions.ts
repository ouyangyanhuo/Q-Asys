"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, requireAdmin } from "@/lib/auth";
import { publishAnswer, setStatus } from "@/lib/store";

export async function saveAnswerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id || !answer) return;

  await publishAnswer(id, answer);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function publishAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await setStatus(id, "published");
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function hideAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await setStatus(id, "hidden");
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
