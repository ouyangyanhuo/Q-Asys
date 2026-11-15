import { neon } from "@neondatabase/serverless";
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

  // 顺手清掉过期窗口，约每五十次一次，避免表无限增长
  if (Math.random() < 0.02) {
    void (async () => {
      try {
        await db()`delete from rate_counters where window_start < now() - interval '2 days'`;
      } catch {
        // 清理失败不影响本次计数
      }
    })();
  }

  return {
    hits: rows[0]?.hits ?? 1,
    windowStart: rows[0]?.window_start ?? Math.floor(Date.now() / 1000),
  };
}

export async function createQuestion(input: NewQuestion): Promise<Question> {
  const rows = (await db()`
    insert into questions (body, nickname, status, ip_hash)
    values (${input.body}, ${input.nickname}, 'pending', ${input.ipHash})
    returning id, body, nickname, status, answer, answered_at, created_at
  `) as unknown as Row[];
  return map(rows[0]);
}

export async function setStatus(
  id: string,
  status: QuestionStatus,
): Promise<void> {
  await db()`update questions set status = ${status} where id = ${id}`;
}

export async function publishAnswer(id: string, answer: string): Promise<void> {
  await db()`
    update questions
    set answer = ${answer}, status = 'published', answered_at = now()
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
