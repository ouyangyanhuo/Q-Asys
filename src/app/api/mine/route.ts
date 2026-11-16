import { NextResponse } from "next/server";
import { listByVisitor } from "@/lib/store";
import { readVisitorHash } from "@/lib/visitor";
import { clientIpHash } from "@/lib/request";
import { allowInMemory } from "@/lib/memory-limit";

export const dynamic = "force-dynamic";

/**
 * 取回「我投出、还没过审」的几封。
 * 认人只靠那枚匿名 cookie，返回内容不含任何身份信息，也不可被 CDN 缓存。
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };

  // 每分钟至多 30 次：这个接口只读自己的几封信，正常流量远低于此，
  // 用进程内计数即可，不必为它多打一次数据库。
  const ipHash = await clientIpHash();
  if (!allowInMemory(`mine:${ipHash}`, 30, 60)) {
    return NextResponse.json(
      { pending: [] },
      { status: 429, headers: { ...headers, "Retry-After": "60" } },
    );
  }

  try {
    const visitorHash = await readVisitorHash();
    if (!visitorHash) return NextResponse.json({ pending: [] }, { headers });

    const letters = await listByVisitor(visitorHash);
    return NextResponse.json(
      { pending: letters.filter((letter) => letter.status === "pending") },
      { headers },
    );
  } catch (error) {
    // 表结构没迁移、数据库抖动都走这里：页面当作没有私函即可，
    // 但日志必须留下痕迹，否则线上只能看到「什么都没有」。
    console.error("[api/mine] failed to load pending letters:", error);
    return NextResponse.json({ pending: [] }, { headers });
  }
}
