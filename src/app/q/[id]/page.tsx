import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LetterView } from "@/components/letter-view";
import { getQuestion } from "@/lib/store";

/**
 * 公开信笺：人人看到的都一样，交给 ISR。
 * 首次访问生成一份静态页，之后直接由边缘返回，不进函数、不查库。
 */
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

/**
 * 空列表 + dynamicParams，让这条路由成为「按需生成的静态页」：
 * 没有它，App Router 会把动态段当作纯动态路由，revalidate 不起作用。
 */
export async function generateStaticParams() {
  return [] as Array<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q || q.status !== "published") return { title: "未得此笺 · 尺素" };
  const excerpt = [...q.body].slice(0, 40).join("");
  return {
    title: `${excerpt} · 尺素`,
    description: [...q.body].slice(0, 120).join(""),
  };
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q || q.status !== "published") notFound();

  return <LetterView q={q} />;
}
