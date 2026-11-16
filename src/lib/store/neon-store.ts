import { neon } from "@neondatabase/serverless";
import { MAX_ANSWER } from "@/lib/types";
import type { NewQuestion, Question, QuestionStatus, Stats } from "@/lib/types";

type Row = {
  id: string;
  body: string;
  nickname: string | null;
  status: string;
  answer: string | null;
  answered_at: string | Date | null;
  created_at: string | Date;
};

let cached: ReturnType<typeof neon> | null = null;

function db() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    cached = neon(url);
  }
  return cached;
}

function iso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function map(row: Row): Question {
  return {
    id: row.id,
    body: row.body,
    nickname: row.nickname,
    status: row.status as QuestionStatus,
    answer: row.answer,
    answeredAt: iso(row.answered_at),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  };
}

export async function listPublished(limit = 50): Promise<Question[]> {
  const rows = (await db()`
    select id, body, nickname, status, answer, answered_at, created_at
    from questions
    where status = 'published'
    order by created_at desc
    limit ${limit}
  `) as unknown as Row[];
  return rows.map(map);
}

/** 只放行合法 UUID；畸形 id 直接当作「查无此笺」，不打到 Postgres 的 uuid 解析上 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getQuestion(id: string): Promise<Question | null> {
  if (!UUID.test(id)) return null;

  const rows = (await db()`
    select id, body, nickname, status, answer, answered_at, created_at
    from questions
    where id = ${id}
    limit 1
  `) as unknown as Row[];
  return rows.length ? map(rows[0]) : null;
}

export async function listAll(): Promise<Question[]> {
  const rows = (await db()`
    select id, body, nickname, status, answer, answered_at, created_at
    from questions
    order by created_at desc
    limit 200
  `) as unknown as Row[];
  return rows.map(map);
}

export interface RateCounterEntry {
  key: string;
  windowSeconds: number;
}

export interface RateCounterReading {
  key: string;
  hits: number;
  windowStart: number;
}

let lastSweep = 0;

/**
 * 清过期窗口。用「每小时最多一次」的进程内节流，而不是按概率触发——
 * 低流量站点上 2% 概率可能一整天都轮不到一次，表会悄悄长胖。
 */
async function sweepRateCounters(): Promise<void> {
  const now = Date.now();
  if (now - lastSweep < 60 * 60 * 1000) return;
  lastSweep = now;
  try {
    await db()`delete from rate_counters where window_start < now() - interval '2 days'`;
  } catch {
    lastSweep = 0; // 失败就下次再试
  }
}

/**
 * 一次往返记两条（分钟窗 + 小时窗）。
 * 固定窗口的起点交给数据库算，避免多实例之间时钟漂移。
 */
export async function hitRateCounters(
  entries: [RateCounterEntry, RateCounterEntry],
): Promise<RateCounterReading[]> {
  const [a, b] = entries;
  const rows = (await db()`
    insert into rate_counters (key, window_start, hits)
    values
      (
        ${a.key},
        to_timestamp(
          (floor(extract(epoch from now()) / ${a.windowSeconds}) * ${a.windowSeconds})::double precision
        ),
        1
      ),
      (
        ${b.key},
        to_timestamp(
          (floor(extract(epoch from now()) / ${b.windowSeconds}) * ${b.windowSeconds})::double precision
        ),
        1
      )
    on conflict (key, window_start)
      do update set hits = rate_counters.hits + 1
    returning key, hits,
      extract(epoch from window_start)::int as window_start
  `) as unknown as Array<{ key: string; hits: number; window_start: number }>;

  void sweepRateCounters();

  return rows.map((row) => ({
    key: row.key,
    hits: row.hits,
    windowStart: row.window_start,
  }));
}

/**
 * 固定窗口计数器：单条 upsert 完成「读—加一—写」，
 * 由 Postgres 的行锁保证并发原子，多实例共享同一个窗口。
 * 返回本窗口已计次数与窗口起点（epoch 秒）。
 */
export async function hitRateCounter(
  key: string,
  windowSeconds: number,
): Promise<{ hits: number; windowStart: number }> {
  const rows = (await db()`
    insert into rate_counters (key, window_start, hits)
    values (
      ${key},
      to_timestamp(
        (floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds})::double precision
      ),
      1
    )
    on conflict (key, window_start)
      do update set hits = rate_counters.hits + 1
    returning hits,
      extract(epoch from window_start)::int as window_start
  `) as unknown as Array<{ hits: number; window_start: number }>;

  void sweepRateCounters();

  return {
    hits: rows[0]?.hits ?? 1,
    windowStart: rows[0]?.window_start ?? Math.floor(Date.now() / 1000),
  };
}

export async function createQuestion(input: NewQuestion): Promise<Question> {
  try {
    const rows = (await db()`
      insert into questions (body, nickname, status, ip_hash, visitor_hash)
      values (
        ${input.body}, ${input.nickname}, 'pending', ${input.ipHash}, ${input.visitorHash}
      )
      returning id, body, nickname, status, answer, answered_at, created_at
    `) as unknown as Row[];
    return map(rows[0]);
  } catch (error) {
    // 迁移没跑（缺 visitor_hash 列）时先保证信能存下，只是「我的去信」里看不到
    if (!String(error).includes("visitor_hash")) throw error;
    console.warn("[store] visitor_hash column missing, fallback insert");
    const rows = (await db()`
      insert into questions (body, nickname, status, ip_hash)
      values (${input.body}, ${input.nickname}, 'pending', ${input.ipHash})
      returning id, body, nickname, status, answer, answered_at, created_at
    `) as unknown as Row[];
    return map(rows[0]);
  }
}

/** 某人投过的全部来信（含未审的候复稿），供「我的去信」 */
export async function listByVisitor(visitorHash: string): Promise<Question[]> {
  try {
    const rows = (await db()`
      select id, body, nickname, status, answer, answered_at, created_at
      from questions
      where visitor_hash = ${visitorHash}
        and status <> 'hidden'
      order by created_at desc
      limit 50
    `) as unknown as Row[];
    return rows.map(map);
  } catch (error) {
    if (String(error).includes("visitor_hash")) return [];
    throw error;
  }
}

/** 这封候复中的信是否由本人投出 */
export async function isQuestionOwner(
  id: string,
  visitorHash: string,
): Promise<boolean> {
  if (!UUID.test(id)) return false;
  try {
    const rows = (await db()`
      select 1 from questions
      where id = ${id} and visitor_hash = ${visitorHash} and status = 'pending'
      limit 1
    `) as unknown as unknown[];
    return rows.length > 0;
  } catch (error) {
    if (String(error).includes("visitor_hash")) return false;
    throw error;
  }
}

export async function setStatus(
  id: string,
  status: QuestionStatus,
): Promise<void> {
  await db()`update questions set status = ${status} where id = ${id}`;
}

export async function publishAnswer(id: string, answer: string): Promise<void> {
  // 数据库层有 check 约束，这里再截断一次，避免约束未加上时写入超长正文
  const clipped = answer.slice(0, MAX_ANSWER);
  await db()`
    update questions
    set answer = ${clipped}, status = 'published', answered_at = now()
    where id = ${id}
  `;
}

export async function getStats(): Promise<Stats> {
  const rows = (await db()`
    select
      count(*) filter (where status = 'published')::int as published,
      count(*) filter (where status = 'published' and answer is not null)::int as answered,
      count(*) filter (where status = 'pending')::int as pending
    from questions
  `) as unknown as Stats[];
  return rows[0] ?? { published: 0, answered: 0, pending: 0 };
}
