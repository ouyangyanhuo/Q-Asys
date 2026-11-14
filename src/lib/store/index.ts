import * as local from "./local-store";
import * as remote from "./neon-store";
import type { NewQuestion, Question, QuestionStatus, Stats } from "@/lib/types";

export const isRemote = () => Boolean(process.env.DATABASE_URL);

const impl = () => (isRemote() ? remote : local);

export function listPublished(limit?: number): Promise<Question[]> {
  return impl().listPublished(limit);
}

export function getQuestion(id: string): Promise<Question | null> {
  return impl().getQuestion(id);
}

export function listAll(): Promise<Question[]> {
  return impl().listAll();
}

export function countRecentByIp(ipHash: string): Promise<number> {
  return impl().countRecentByIp(ipHash);
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
