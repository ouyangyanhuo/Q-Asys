/**
 * 进程内固定窗口限流，只用于「读自己的数据」这类低风险接口。
 *
 * 它挡不住分布式的攻击（每个实例各算各的），但足以拦住同一台机器
 * 对 /api/mine 的循环调用，而且不额外消耗一次数据库往返。
 */
const buckets = new Map<string, { windowStart: number; hits: number }>();

export function allowInMemory(
  key: string,
  limit: number,
  windowSeconds: number,
): boolean {
  const size = windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / size) * size;
  const current = buckets.get(key);
  const hits = current && current.windowStart === windowStart ? current.hits + 1 : 1;

  buckets.set(key, { windowStart, hits });

  if (buckets.size > 2000) {
    for (const [k, v] of buckets) {
      if (v.windowStart < windowStart - 60_000) buckets.delete(k);
    }
  }

  return hits <= limit;
}
