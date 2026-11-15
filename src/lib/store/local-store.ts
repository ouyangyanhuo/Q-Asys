import { promises as fs } from "node:fs";
import path from "node:path";
import type { NewQuestion, Question, QuestionStatus, Stats } from "@/lib/types";

const FILE = path.join(process.cwd(), ".data", "db.json");

interface StoredQuestion extends Question {
  ipHash?: string | null;
}

interface Shape {
  questions: StoredQuestion[];
}

let lock: Promise<unknown> = Promise.resolve();

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = lock.then(fn, fn);
  lock = next.catch(() => undefined);
  return next;
}

function seed(): StoredQuestion[] {
  const day = 86_400_000;
  const now = Date.now();
  const rows: Array<{
    body: string;
    nickname: string | null;
    answer: string | null;
    days: number;
    pending?: boolean;
  }> = [
    {
      body: "想问你一个可能有点冒犯的问题：你会不会有时候觉得，自己其实并没有那么想被了解？",
      nickname: null,
      days: 1,
      answer:
        "会。被了解是件很耗神的事，得先把自己整理一遍，再交出去。有些时候我只是想被听见，不想被看懂。这两件事差得很远。",
    },
    {
      body: "如果把这些年写过的日记一次性烧掉，你会舍不得吗？",
      nickname: "路过的人",
      days: 4,
      answer:
        "舍不得的不是内容，是那个写下它们的自己。不过我想我会烧。留着的东西久了会变成证据，而我不太想给自己留证据。",
    },
    {
      body: "怎么判断一件事是「还没到时候」，还是「根本不会发生」？",
      nickname: null,
      days: 9,
      answer:
        "看它还愿不愿意让你难受。真不会发生的事，想起来是平的；还没到时候的事，想起来会疼。",
    },
    {
      body: "你最近一次觉得「活着真好」是什么时候？",
      nickname: null,
      days: 15,
      answer:
        "前天傍晚，煮面的时候水开了，蒸汽把窗子糊住。我什么都没想，就站在那儿等面熟。那种没有目的的几分钟，很久没有过了。",
    },
    {
      body: "有没有一句话，你一直想说，但始终没有说出口？",
      nickname: null,
      days: 23,
      answer:
        "有。而且我大概会一直不说。有些话一旦说出口，就不再属于我了。",
    },
    {
      body: "你好。我最近总是睡不好，脑子里像有一台没关掉的收音机。你是怎么让自己安静下来的？",
      nickname: "凌晨三点",
      days: 0.2,
      answer: null,
      pending: true,
    },
  ];

  return rows.map((row, i) => ({
    id: `seed-${String(i + 1).padStart(2, "0")}`,
    body: row.body,
    nickname: row.nickname,
    status: row.pending ? "pending" : "published",
    answer: row.answer,
    answeredAt: row.answer
      ? new Date(now - (row.days - 0.3) * day).toISOString()
      : null,
    createdAt: new Date(now - row.days * day).toISOString(),
    ipHash: null,
  }));
}

async function read(): Promise<Shape> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Shape;
    if (!Array.isArray(parsed.questions)) throw new Error("corrupt");
    return parsed;
  } catch {
    const fresh: Shape = { questions: seed() };
    await write(fresh);
    return fresh;
  }
}

async function write(data: Shape): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

function byNewest(a: Question, b: Question) {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export async function listPublished(limit = 50): Promise<Question[]> {
  const data = await read();
  return data.questions
    .filter((q) => q.status === "published")
    .sort(byNewest)
    .slice(0, limit)
    .map(strip);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const data = await read();
  const found = data.questions.find((q) => q.id === id);
  return found ? strip(found) : null;
}

export async function listAll(): Promise<Question[]> {
  const data = await read();
  return data.questions.sort(byNewest).map(strip);
}

/**
 * 本地开发的限流计数：进程内 Map。
 * 仅供 `bun dev` 使用，多进程不共享；线上走 neon-store 的数据库计数。
 */
const counters = new Map<string, { windowStart: number; hits: number }>();

export async function hitRateCounter(
  key: string,
  windowSeconds: number,
): Promise<{ hits: number; windowStart: number }> {
  const size = windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / size) * size;
  const current = counters.get(key);
  const hits = current && current.windowStart === windowStart ? current.hits + 1 : 1;
  counters.set(key, { windowStart, hits });

  // 顺手回收旧窗口
  if (counters.size > 500) {
    for (const [k, v] of counters) {
      if (v.windowStart < windowStart - 3_600_000) counters.delete(k);
    }
  }

  return { hits, windowStart: windowStart / 1000 };
}

export async function createQuestion(input: NewQuestion): Promise<Question> {
  return serial(async () => {
    const data = await read();
    const row: StoredQuestion = {
      id: crypto.randomUUID(),
      body: input.body,
      nickname: input.nickname,
      status: "pending",
      answer: null,
      answeredAt: null,
      createdAt: new Date().toISOString(),
      ipHash: input.ipHash,
    };
    data.questions.unshift(row);
    await write(data);
    return strip(row);
  });
}

export async function setStatus(
  id: string,
  status: QuestionStatus,
): Promise<void> {
  await serial(async () => {
    const data = await read();
    const row = data.questions.find((q) => q.id === id);
    if (!row) return;
    row.status = status;
    await write(data);
  });
}

export async function publishAnswer(id: string, answer: string): Promise<void> {
  await serial(async () => {
    const data = await read();
    const row = data.questions.find((q) => q.id === id);
    if (!row) return;
    row.answer = answer;
    row.answeredAt = new Date().toISOString();
    row.status = "published";
    await write(data);
  });
}

export async function getStats(): Promise<Stats> {
  const data = await read();
  const published = data.questions.filter((q) => q.status === "published");
  return {
    published: published.length,
    answered: published.filter((q) => Boolean(q.answer)).length,
    pending: data.questions.filter((q) => q.status === "pending").length,
  };
}

function strip(row: StoredQuestion): Question {
  return {
    id: row.id,
    body: row.body,
    nickname: row.nickname,
    status: row.status,
    answer: row.answer,
    answeredAt: row.answeredAt,
    createdAt: row.createdAt,
  };
}
