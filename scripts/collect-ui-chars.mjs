/**
 * 收集「固定文案」用到的全部字符，供构建期切字体用。
 * 只扫 src/ 下的源码；用户来信是运行时数据，不在这里。
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "src";
const SKIP = new Set([join("src", "lib", "ui-charset.ts")]);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (!SKIP.has(p) && [".ts", ".tsx", ".css"].includes(extname(entry.name)))
      files.push(p);
  }
})(ROOT);

const CJK = /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u2000-\u206F]/;
const ASCII = /[\u0020-\u007E]/;

const chars = new Set();
for (const file of files) {
  let text = readFileSync(file, "utf-8");
  // 注释里的字不会出现在页面上，剔掉以免把子集撑大
  text = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const ch of text) {
    if (CJK.test(ch) || ASCII.test(ch)) chars.add(ch);
  }
}

for (const ch of "·—…‘’“”《》〈〉–　") chars.add(ch);

const sorted = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
const text = sorted.join("");
mkdirSync(".fonts", { recursive: true });
writeFileSync(".fonts/ui-chars.txt", text, "utf-8");

// 运行时按页切字要拿这份表做差集：UI 已覆盖的字不必再进本页子集。
// 与字体同源生成，避免两边漂移。
mkdirSync("src/lib", { recursive: true });
writeFileSync(
  "src/lib/ui-charset.ts",
  `/**\n * 由 scripts/collect-ui-chars.mjs 生成，请勿手改。\n * 与 public/fonts/v1/ui-*.woff2 的字符集保持一致。\n */\nexport const UI_CHARS = ${JSON.stringify(text)};\n`,
  "utf-8",
);

const cjkCount = sorted.filter((c) => c.charCodeAt(0) > 0x2e80).length;
console.log(`扫描 ${files.length} 个文件 → ${sorted.length} 个字符（其中汉字/全角 ${cjkCount}）`);
