import { cache } from "react";
import * as local from "./local-store";
import * as remote from "./neon-store";
import type { NewQuestion, Question, QuestionStatus, Stats } from "@/lib/types";

export const isRemote = () => Boolean(process.env.DATABASE_URL);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 这个 id 能不能拿去查库／改库，由存储实现决定：
 * 线上是 uuid（不合法会直接把 Postgres 打报错），
 * 本地 JSON 库的种子 id 是 "seed-01" 这种短串。
 */
export function isAcceptableId(id: string): boolean {
  if (!id || id.length > 64) return false;
  return isRemote() ? UUID_RE.test(id) : /^[a-z0-9-]+$/i.test(id);
}

const impl = () => (isRemote() ? remote : local);

export function listPublished(limit?: number): Promise<Question[]> {
  return impl().listPublished(limit);
}

/**
 * 同一请求内只查一次库。
 * generateMetadata 与页面组件都会取同一封信，不包 cache 就会打两次数据库，
 * 而且元数据那一次往往落在响应流的中后段，直接把「内容下载」拖长。
 */
export const getQuestion = cache(
  (id: string): Promise<Question | null> => impl().getQuestion(id),
);

export function listAll(): Promise<Question[]> {
  return impl().listAll();
}

export function listByVisitor(visitorHash: string): Promise<Question[]> {
  return impl().listByVisitor(visitorHash);
}

export function isQuestionOwner(
  id: string,
  visitorHash: string,
): Promise<boolean> {
  return impl().isQuestionOwner(id, visitorHash);
}

export function hitRateCounter(
  key: string,
  windowSeconds: number,
): Promise<{ hits: number; windowStart: number }> {
  return impl().hitRateCounter(key, windowSeconds);
}

export function hitRateCounters(
  entries: [
    { key: string; windowSeconds: number },
    { key: string; windowSeconds: number },
  ],
): Promise<Array<{ key: string; hits: number; windowStart: number }>> {
  return impl().hitRateCounters(entries);
}

export function createQuestion(input: NewQuestion): Promise<Question> {
  return impl().createQuestion(input);
}

export function setStatus(
  id: string,
  status: QuestionStatus,
): Promise<void> {
  return impl().setStatus(id, status);
}

export function publishAnswer(id: string, answer: string): Promise<void> {
  return impl().publishAnswer(id, answer);
}

export function getStats(): Promise<Stats> {
  return impl().getStats();
}

export * from "@/lib/types";
