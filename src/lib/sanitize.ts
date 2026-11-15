/**
 * 输入净化与危险内容检测。
 *
 * 定位：**存储层降噪 + 兜底拦截**，不是唯一防线。
 * - XSS 的根本防线是输出编码：本项目所有内容都以纯文本渲染，React 自动转义；
 *   这里做的是不让标记语言落进库里，避免将来某处误用 dangerouslySetInnerHTML 时被引爆。
 * - SQL 注入的根本防线是参数化查询：所有语句走 neon 模板参数，不做字符串拼接；
 *   这里的黑名单只拦高置信度载荷，用于尽早拒绝并留下信号。
 */

export type RejectCode =
  | "empty"
  | "too_long"
  | "control"
  | "script"
  | "sql"
  | "markup";

export type SanitizeResult =
  | { ok: true; value: string; flags: string[] }
  | { ok: false; code: RejectCode };

export interface SanitizeOptions {
  maxLength: number;
  /** 昵称、回信不允许换行 */
  singleLine?: boolean;
}

/** 失败时的对外话术，统一在服务端给出，不回显用户原文 */
export const REJECT_MESSAGE: Record<RejectCode, string> = {
  empty: "尚无一字。",
  too_long: `至多 {max} 字，请删减几分。`,
  control: "文中有无法识别的字符，请重新誊写。",
  script: "此中含有可执行的内容，恕不能收录。",
  sql: "此中含有数据库指令，恕不能收录。",
  markup: "请以纯文字书写，勿附标记。",
};

/* 零宽、软连字符、双向覆盖字符——看不见，但能用来拼接绕过或伪装顺序 */
const INVISIBLE = /[\u00AD\u200B-\u200F\u2060-\u2064\uFEFF]/g;
const BIDI = /[\u202A-\u202E\u2066-\u2069]/g;
/* 控制字符：保留 \t 与 \n，其余（含 NULL 字节）一律剔除 */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/* 整段标签；限长 400 避免对超长文本做回溯 */
const TAG = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]{0,400})?\/?>/g;
/* 危险标签：不剥离，直接拒绝 */
const DANGEROUS_TAG =
  /<\s*\/?\s*(script|iframe|object|embed|applet|svg|math|style|link|meta|base|form|input|textarea)\b/i;
const EVENT_ATTR = /\bon[a-z]{3,15}\s*=/i;
const DANGEROUS_SCHEME =
  /(?:javascript|vbscript)\s*:|data\s*:\s*(?:text\/html|application\/xhtml\+xml|image\/svg\+xml)/i;

/* 高置信度注入载荷：宁可漏，不可误伤正常提问 */
const SQL_PATTERNS: RegExp[] = [
  /'\s*(?:or|and)\s+\d+\s*=\s*\d+/i,
  /\bunion\s+(?:all\s+)?select\b/i,
  /\b(?:drop|truncate|alter)\s+(?:table|database|schema)\b/i,
  /;\s*(?:delete|update|insert|drop)\s+[a-z"']/i,
  /\binformation_schema\b/i,
  /\bpg_sleep\s*\(/i,
  /\bxp_cmdshell\b/i,
  /\bwaitfor\s+delay\b/i,
  /\bextractvalue\s*\(/i,
  /\bload_file\s*\(/i,
];

/** 只留「有内容的字符」：至少一个字母或数字，纯标点不算写了字 */
const HAS_CONTENT = /[\p{L}\p{N}]/u;

export function sanitizeText(
  input: string,
  { maxLength, singleLine = false }: SanitizeOptions,
): SanitizeResult {
  const flags: string[] = [];

  // 粗筛：超长输入在跑正则之前就挡掉，避免拿几百 KB 的文本做回溯
  if (typeof input !== "string") return { ok: false, code: "empty" };
  if (input.length > maxLength * 20) return { ok: false, code: "too_long" };

  let text = input.normalize("NFC").replace(/\r\n?/g, "\n");

  // 在剥离之前先看原貌，避免 <scr<script>ipt> 这类嵌套绕过
  if (DANGEROUS_TAG.test(text) || EVENT_ATTR.test(text) || DANGEROUS_SCHEME.test(text)) {
    return { ok: false, code: "script" };
  }
  if (SQL_PATTERNS.some((re) => re.test(text))) return { ok: false, code: "sql" };

  const withoutInvisible = text.replace(INVISIBLE, "").replace(BIDI, "");
  if (withoutInvisible.length !== text.length) flags.push("invisible_removed");
  text = withoutInvisible;

  const withoutControl = text.replace(CONTROL, "");
  if (withoutControl.length !== text.length) flags.push("control_removed");
  text = withoutControl;

  // 普通标签：剥掉，只留文字（例如用户从别处粘贴带格式的内容）
  const stripped = text.replace(TAG, "");
  if (stripped.length !== text.length) flags.push("tag_removed");
  text = stripped;

  // 剥完仍有「看起来像标签」的残片，说明写法不规整，拒绝而不是猜
  if (/<\/?[a-zA-Z][^<>]*>/.test(text)) return { ok: false, code: "markup" };

  if (singleLine) text = text.replace(/\n+/g, " ");

  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 刷屏式重复：同一字符连打 20 个以上，收成 6 个
  const collapsed = text.replace(/(.)\1{19,}/gu, (_m, ch: string) => ch.repeat(6));
  if (collapsed.length !== text.length) flags.push("flood_collapsed");
  text = collapsed;

  const size = [...text].length;
  if (size === 0 || !HAS_CONTENT.test(text)) return { ok: false, code: "empty" };
  if (size > maxLength) return { ok: false, code: "too_long" };

  return { ok: true, value: text, flags };
}

/** 把失败码翻译成话术，供 Server Action 直接返回 */
export function rejectMessage(code: RejectCode, maxLength: number): string {
  return REJECT_MESSAGE[code].replace("{max}", String(maxLength));
}
