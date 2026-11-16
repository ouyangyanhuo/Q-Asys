/**
 * 限流：固定窗口计数器，计数落在数据库里，跨实例共享。
 *
 * 为什么不用内存计数：Vercel 的函数是多实例、随时冷启动的，进程内的 Map
 * 每个实例各算各的，攻击者只要并发打过来就能成倍突破阈值。
 *
 * 两条 SQL 完成判定：
 *   1) 一次 upsert 同时记「分钟窗」与「小时窗」，先判这两条；
 *   2) 通过之后才记「全站窗」——被本地规则拦下的请求不消耗全站额度，
 *      否则一个脚本就能把全站额度打空，让所有人一小时投不了信。
 */

import { hitRateCounter, hitRateCounters } from "@/lib/store";
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
  /** ip：按来访者计；global：全站兜底 */
  scope: "ip" | "global";
}

export interface RateVerdict {
  allowed: boolean;
  rule: RateRule | null;
  hits: number;
  remaining: number;
  /** 建议等待秒数，超限时给出 */
  retryAfter: number;
}

/** 三个维度：短窗防连点，长窗防刷屏，全站兜底防 IP 池 */
export function buildRules(bucket: string): RateRule[] {
  return [
    {
      key: `${bucket}:1m`,
      limit: RATE_LIMIT_PER_MINUTE,
      windowSeconds: 60,
      scope: "ip",
    },
    {
      key: `${bucket}:1h`,
      limit: RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
      scope: "ip",
    },
    {
      key: "global:1h",
      limit: RATE_LIMIT_GLOBAL_PER_HOUR,
      windowSeconds: 3600,
      scope: "global",
    },
  ];
}

function blocked(rule: RateRule, hits: number, windowStart: number): RateVerdict {
  const resetAt = (windowStart + rule.windowSeconds) * 1000;
  return {
    allowed: false,
    rule,
    hits,
    remaining: 0,
    retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

export async function checkRate(
  bucket: string,
  rules: RateRule[] = buildRules(bucket),
): Promise<RateVerdict> {
  const ipRules = rules.filter((rule) => rule.scope === "ip");
  const globalRule = rules.find((rule) => rule.scope === "global") ?? null;

  let ipReadings: Array<{ key: string; hits: number; windowStart: number }>;

  try {
    // 先计数再判断：超限的请求同样消耗额度，避免「拒绝了却不计数」被无限重试
    ipReadings =
      ipRules.length === 2
        ? await hitRateCounters([
            { key: ipRules[0].key, windowSeconds: ipRules[0].windowSeconds },
            { key: ipRules[1].key, windowSeconds: ipRules[1].windowSeconds },
          ])
        : await Promise.all(
            ipRules.map(async (rule) => {
              const reading = await hitRateCounter(
                rule.key,
                rule.windowSeconds,
              );
              return { key: rule.key, ...reading };
            }),
          );
  } catch (error) {
    // 计数表不可用（例如迁移没跑）时放行并告警，不因限流设施故障把投递整体打死
    console.error("[rate] counter unavailable, fail open:", error);
    return { allowed: true, rule: null, hits: 0, remaining: 0, retryAfter: 0 };
  }

  // 按 key 取，而不是按 returning 的行序取（多行 upsert 不保证顺序）
  const byKey = new Map(ipReadings.map((reading) => [reading.key, reading]));

  for (const rule of ipRules) {
    const reading = byKey.get(rule.key);
    if (!reading) continue;
    if (reading.hits > rule.limit) {
      return blocked(rule, reading.hits, reading.windowStart);
    }
  }

  if (!globalRule) {
    const last = ipReadings[ipReadings.length - 1];
    return {
      allowed: true,
      rule: ipRules[ipRules.length - 1] ?? null,
      hits: last?.hits ?? 0,
      remaining: 0,
      retryAfter: 0,
    };
  }

  // 本地规则全部通过，才动全站额度
  try {
    const global = await hitRateCounter(
      globalRule.key,
      globalRule.windowSeconds,
    );
    if (global.hits > globalRule.limit) {
      return blocked(globalRule, global.hits, global.windowStart);
    }
    return {
      allowed: true,
      rule: globalRule,
      hits: global.hits,
      remaining: Math.max(0, globalRule.limit - global.hits),
      retryAfter: 0,
    };
  } catch (error) {
    console.error("[rate] global counter unavailable, fail open:", error);
    return { allowed: true, rule: null, hits: 0, remaining: 0, retryAfter: 0 };
  }
}

/** 把秒数说成人话，用于超限提示 */
export function waitPhrase(seconds: number): string {
  if (seconds <= 60) return "请稍候片刻再来";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `请 ${minutes} 分钟后再试`;
  const hours = Math.ceil(minutes / 60);
  return `请 ${hours} 小时后再来`;
}
