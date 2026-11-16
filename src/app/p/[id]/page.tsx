import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/letter-view";
import { getQuestion, isQuestionOwner } from "@/lib/store";
import { readVisitorHash } from "@/lib/visitor";

/**
 * 候复中的私函：只有投信人自己（凭匿名 cookie）能打开。
 * 需要读 cookie，所以这一条保持动态渲染；公开信走 /q/[id] 的 ISR。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "候复 · 尺素",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function PendingLetterPage({ params }: Props) {
  const { id } = await params;

  const q = await getQuestion(id);
  if (!q || q.status !== "pending") notFound();

  const visitorHash = await readVisitorHash();
  if (!visitorHash) notFound();
  if (!(await isQuestionOwner(id, visitorHash))) notFound();

  return <LetterView q={q} owned />;
}
