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

export async function getQuestion(id: string): Promise<Question | null> {
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

export async function countRecentByIp(ipHash: string): Promise<number> {
  const rows = (await db()`
    select count(*)::int as count
    from questions
    where ip_hash = ${ipHash}
      and created_at > now() - interval '1 hour'
  `) as unknown as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
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
