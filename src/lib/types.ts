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
  /** 访客标识的哈希，用于「只有投信人自己看得见未审的这封」 */
  visitorHash: string;
}

export const MAX_BODY = 500;
export const MAX_NICKNAME = 16;
export const MAX_ANSWER = 2000;

/**
 * 限流阈值
 * 短窗：同一来源每分钟 3 次，挡连点与脚本试探
 * 长窗：同一来源每小时 5 封，挡刷屏
 * 全站：每小时 50 封，挡分布式 IP 池把库写爆
 */
export const RATE_LIMIT_PER_MINUTE = 3;
export const RATE_LIMIT_PER_HOUR = 5;
export const RATE_LIMIT_GLOBAL_PER_HOUR = 50;
