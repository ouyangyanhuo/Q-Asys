export type QuestionStatus = "pending" | "published" | "hidden";

export interface Question {
  id: string;
  body: string;
  nickname: string | null;
  status: QuestionStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface Stats {
  published: number;
  answered: number;
  pending: number;
}

export interface NewQuestion {
  body: string;
  nickname: string | null;
  ipHash: string;
}

export const MAX_BODY = 500;
export const MAX_NICKNAME = 16;
export const RATE_LIMIT_PER_HOUR = 5;
