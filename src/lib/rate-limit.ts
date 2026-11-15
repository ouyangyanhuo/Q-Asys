/**
 * 限流：固定窗口计数器，计数落在数据库里，跨实例共享。
 *
 * 为什么不用内存计数：Vercel 的函数是多实例、随时冷启动的，进程内的 Map
 * 每个实例各算各的，攻击者只要并发打过来就能成倍突破阈值。
 * 这里每次请求只发一条 upsert，把「读—改—写」压进单条 SQL，
 * 由 Postgres 的行锁保证原子性，因此多实例并发下计数不会丢。
 */

import { hitRateCounter } from "@/lib/store";
import {
  RATE_LIMIT_GLOBAL_PER_HOUR,
  RATE_LIMIT_PER_HOUR,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/types";

export interface RateRule {
  key: string;
  /** 窗口内允许的次数 */
  limit: number;
  /** 窗口长度（秒） */
  windowSeconds: number;
}

export interface RateVerdict {
  allowed: boolean;
  rule: RateRule | null;
  hits: number;
  remaining: number;
  /** 建议等待秒数，超限时给出 */
  retryAfter: number;
}

/** 三维度：短窗防连点，长窗防刷屏，全站兜底防 IP 池 */
export function buildRules(bucket: string): RateRule[] {
  return [
    { key: `${bucket}:1m`, limit: RATE_LIMIT_PER_MINUTE, windowSeconds: 60 },
    { key: `${bucket}:1h`, limit: RATE_LIMIT_PER_HOUR, windowSeconds: 3600 },
    { key: "global:1h", limit: RATE_LIMIT_GLOBAL_PER_HOUR, windowSeconds: 3600 },
  ];
}

export async function checkRate(
  bucket: string,
  rules: RateRule[] = buildRules(bucket),
): Promise<RateVerdict> {
  let lastHits = 0;
  let lastRule: RateRule | null = null;

  for (const rule of rules) {
    let counted: { hits: number; windowStart: number };
    try {
      // 先计数再判断：超限的请求同样消耗额度，避免「拒绝了却不计数」被无限重试
      counted = await hitRateCounter(rule.key, rule.windowSeconds);
    } catch (error) {
      // 计数表不可用（例如迁移没跑）时放行并告警，不因限流设施故障把投递整体打死
      console.error("[rate] counter unavailable, fail open:", error);
      return { allowed: true, rule: null, hits: 0, remaining: 0, retryAfter: 0 };
    }

    const { hits, windowStart } = counted;
    lastHits = hits;
    lastRule = rule;

    if (hits > rule.limit) {
      const resetAt = (windowStart + rule.windowSeconds) * 1000;
      return {
        allowed: false,
        rule,
        hits,
        remaining: 0,
        retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
      };
    }
  }

  return {
    allowed: true,
    rule: lastRule,
    hits: lastHits,
    remaining: lastRule ? Math.max(0, lastRule.limit - lastHits) : 0,
    retryAfter: 0,
  };
}

/** 把秒数说成人话，用于超限提示 */
export function waitPhrase(seconds: number): string {
  if (seconds <= 60) return "请稍候片刻再来";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `请 ${minutes} 分钟后再试`;
  const hours = Math.ceil(minutes / 60);
  return `请 ${hours} 小时后再来`;
}
