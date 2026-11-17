import { createHash } from "node:crypto";
import type { Question } from "@/lib/types";
import { UI_CHARS } from "@/lib/ui-charset";

/**
 * 按页切字：只把这一封信里「UI 子集没有」的字符切出来。
 *
 * 字体栈里本页字体排在 UI 子集之后，所以 UI 已覆盖的字会先命中，
 * 不必在每页的字体文件里重复一遍。常见短信通常只剩几个字，
 * 一页 2–20KB；生僻字多的信也不会超过几十 KB。
 */
export type PageFontFamily = "song" | "kai";

const UI = new Set(UI_CHARS);

export interface PageFont {
  family: PageFontFamily;
  /** 需要切进本页字体的字符（已排序，保证同内容同哈希） */
  chars: string;
  hash: string;
}

function missingFromUi(text: string): string {
  const chars = new Set<string>();
  for (const ch of text) {
    // 空白不需要字形；UI 已覆盖的字由 ui-*.woff2 负责
    if (!ch.trim() || UI.has(ch)) continue;
    chars.add(ch);
  }
  return [...chars]
    .sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0))
    .join("");
}

function digest(chars: string): string {
  return createHash("sha256").update(chars).digest("hex").slice(0, 16);
}

/**
 * 正文与署名用楷，回信用宋——与 LetterView 里的 font-kai / font-song 对应。
 * 返回空数组表示这一页不需要额外的字体文件（全部落在 UI 子集里）。
 */
export function pageFontPlan(q: Question): PageFont[] {
  const plan: PageFont[] = [];

  const kai = missingFromUi(`${q.body}${q.nickname ?? ""}`);
  if (kai) plan.push({ family: "kai", chars: kai, hash: digest(kai) });

  const song = missingFromUi(q.answer ?? "");
  if (song) plan.push({ family: "song", chars: song, hash: digest(song) });

  return plan;
}

export function pageFontUrl(q: Question, font: PageFont): string {
  return `/api/font/${encodeURIComponent(q.id)}/${font.family}?v=${font.hash}`;
}
