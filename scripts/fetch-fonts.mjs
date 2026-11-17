/**
 * 准备运行时按页切字用的源字体。
 *
 * 源文件不进仓库（各 24MB），部署前在 assets/fonts 里备好：
 *   1. 已经在了 → 跳过
 *   2. .fonts 里有本地副本 → 复制
 *   3. 都没有 → 从上游下载
 *
 * package.json 的 postinstall 会调它；也可以手动 node scripts/fetch-fonts.mjs。
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "assets/fonts";
const SOURCES = [
  [
    "NotoSerifSC.ttf",
    "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
  ],
  [
    "LXGWWenKaiScreen.ttf",
    "https://github.com/lxgw/LxgwWenKai-Screen/releases/download/v1.520/LXGWWenKaiScreen.ttf",
  ],
];

mkdirSync(OUT, { recursive: true });

for (const [name, url] of SOURCES) {
  const dest = join(OUT, name);
  if (existsSync(dest)) {
    console.log(`[fonts] ${name} 已就绪`);
    continue;
  }

  const local = join(".fonts", name);
  if (existsSync(local)) {
    copyFileSync(local, dest);
    console.log(`[fonts] ${name} 从 .fonts 复制`);
    continue;
  }

  console.log(`[fonts] ${name} 下载中…`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[fonts] ${name} 下载失败：HTTP ${res.status}`);
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`[fonts] ${name} 完成`);
}
