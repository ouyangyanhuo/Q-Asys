import { NextResponse } from "next/server";
import { listByVisitor } from "@/lib/store";
import { readVisitorHash } from "@/lib/visitor";

export const dynamic = "force-dynamic";

/**
 * 取回「我投出、还没过审」的几封。
 * 认人只靠那枚匿名 cookie，返回内容不含任何身份信息，也不可被 CDN 缓存。
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };

  try {
    const visitorHash = await readVisitorHash();
    if (!visitorHash) return NextResponse.json({ pending: [] }, { headers });

    const letters = await listByVisitor(visitorHash);
    return NextResponse.json(
      { pending: letters.filter((letter) => letter.status === "pending") },
      { headers },
    );
  } catch {
    // 库还没加列时安静返回空，不影响页面
    return NextResponse.json({ pending: [] }, { headers });
  }
}
