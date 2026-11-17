import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import subsetFont from "subset-font";
import { pageFontPlan, type PageFontFamily } from "@/lib/page-font";
import { getQuestion, isQuestionOwner } from "@/lib/store";
import { readVisitorHash } from "@/lib/visitor";

/**
 * 按页切字。
 *
 * 页面里的 @font-face 先声明一个只含「本页生僻字」的小文件，浏览器
 * 按需来取。第一次访问某个哈希时现切（几十到几百毫秒），之后走
 * immutable 缓存；同一个字的组合只切一次。
 *
 * 源字体放在 assets/fonts（由 scripts/fetch-fonts.mjs 准备）；没随包带上时
 * 兜底下载一次到 /tmp，只为部署漏带文件时不至于整页掉字。
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCES: Record<
  PageFontFamily,
  { file: string; url: string }
> = {
  song: {
    file: "NotoSerifSC.ttf",
    url: "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
  },
  kai: {
    file: "LXGWWenKaiScreen.ttf",
    url: "https://github.com/lxgw/LxgwWenKai-Screen/releases/download/v1.520/LXGWWenKaiScreen.ttf",
  },
};

const sourceCache = new Map<PageFontFamily, Promise<Buffer>>();
const subsetCache = new Map<string, Promise<Buffer>>();
const MAX_CACHE = 256;

async function readFirstAvailable(family: PageFontFamily): Promise<Buffer> {
  const { file, url } = SOURCES[family];
  const dir = join(process.cwd(), "assets", "fonts");

  try {
    return await readFile(join(dir, file));
  } catch {
    // 没随包带上，看看 /tmp 有没有上次下好的
  }

  const cacheDir = join(tmpdir(), "qasys-fonts");
  const dest = join(cacheDir, basename(file));
  try {
    return await readFile(dest);
  } catch {
    // 没有缓存，下面下载
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`source font ${file}: HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  await mkdir(cacheDir, { recursive: true });
  await writeFile(dest, data);
  return data;
}

function loadSource(family: PageFontFamily): Promise<Buffer> {
  let job = sourceCache.get(family);
  if (!job) {
    job = readFirstAvailable(family);
    sourceCache.set(family, job);
    job.catch(() => sourceCache.delete(family));
  }
  return job;
}

function render(family: PageFontFamily, chars: string): Promise<Buffer> {
  const key = `${family}:${chars}`;
  let job = subsetCache.get(key);
  if (!job) {
    job = loadSource(family).then((source) =>
      subsetFont(source, chars, { targetFormat: "woff2" }),
    );
    subsetCache.set(key, job);
    if (subsetCache.size > MAX_CACHE) {
      const oldest = subsetCache.keys().next().value;
      if (oldest) subsetCache.delete(oldest);
    }
    job.catch(() => subsetCache.delete(key));
  }
  return job;
}

function notFound(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; family: string }> },
) {
  const { id, family } = await params;
  if (family !== "song" && family !== "kai") return notFound();

  const q = await getQuestion(id);
  if (!q || q.status === "hidden") return notFound();

  // 候复中的私函只有投信人自己能取字体，否则字形文件会泄露正文
  if (q.status === "pending") {
    const visitorHash = await readVisitorHash();
    if (!visitorHash || !(await isQuestionOwner(id, visitorHash))) {
      return notFound();
    }
  }

  const font = pageFontPlan(q).find((item) => item.family === family);
  if (!font) return notFound();

  const version = new URL(request.url).searchParams.get("v");
  // 页面被 ISR 缓存、信件又刚改过时，旧哈希不再对应现有文字。
  // 宁可 404 让浏览器先回退系统字，也不要用错字形。
  if (version && version !== font.hash) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const etag = `"${family}-${font.hash}"`;
  const cacheControl =
    q.status === "published"
      ? "public, max-age=31536000, immutable"
      : "private, max-age=0, must-revalidate";

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl },
    });
  }

  try {
    const woff2 = await render(family, font.chars);
    return new Response(new Uint8Array(woff2), {
      headers: {
        "Content-Type": "font/woff2",
        "Content-Length": String(woff2.byteLength),
        ETag: etag,
        "Cache-Control": cacheControl,
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("[font] subset failed", id, family, error);
    return new Response(null, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
