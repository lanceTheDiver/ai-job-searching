"server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const OPENCLI_BIN = process.env.OPENCLI_BIN || "opencli";
const TAGGED_SELECTOR = '[data-ai-target="1"]';

/** 页面内共用的小工具；每次 eval 都包在 IIFE 里，避免重复声明。 */
const PRELUDE = `
const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const textOf = (e) => (e.getAttribute("aria-label") || "") + " " + (e.innerText || e.textContent || "");
const rx = (r) => new RegExp(r[0], r[1] || "");
const visible = (scope, sel, re) =>
  [...scope.querySelectorAll(sel)].filter(vis).filter((e) => !re || rx(re).test(textOf(e)));
const tag = (e) => {
  document.querySelectorAll("[data-ai-target]").forEach((n) => n.removeAttribute("data-ai-target"));
  if (e) e.setAttribute("data-ai-target", "1");
  return !!e;
};
`;

async function run(session: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync(
      OPENCLI_BIN,
      ["browser", session, ...args],
      { timeout: 90_000, maxBuffer: 8 * 1024 * 1024 },
    );
    return stdout.trim();
  } catch (error) {
    const detail =
      error instanceof Error
        ? ((error as { stderr?: string }).stderr || error.message)
            .split("\n")
            .find((line) => /error|✖|ENOENT|not found/i.test(line)) ||
          error.message
        : String(error);
    throw new Error(
      `OpenCLI 操作失败：${detail.trim()}。请运行 opencli doctor 确认 Browser Bridge 扩展已连接`,
    );
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 在当前浏览器的该会话标签页打开网址。 */
export async function openPage(session: string, url: string) {
  await run(session, ["open", url]);
}

/**
 * 在页面中执行 JS 片段并解析为 JSON；`body` 内用 return 返回对象。
 * 可用 PRELUDE 里的 visible / tag / rx 等工具。
 */
export async function pageEval<T>(session: string, body: string): Promise<T> {
  const output = await run(session, [
    "eval",
    `(() => {${PRELUDE}\n${body}\n})()`,
  ]);
  return JSON.parse(output) as T;
}

export async function isSessionAlive(session: string) {
  return pageEval<{ ok: boolean }>(session, "return { ok: true };")
    .then(() => true)
    .catch(() => false);
}

/** 点击上一次 `tag()` 标记的元素（走浏览器真实点击，非 JS 合成）。 */
export async function clickTagged(session: string) {
  await run(session, ["click", TAGGED_SELECTOR]);
}

export async function fillTagged(session: string, text: string) {
  await run(session, ["fill", TAGGED_SELECTOR, text]);
}

export async function uploadTagged(session: string, filePath: string) {
  await run(session, ["upload", TAGGED_SELECTOR, filePath]);
}

export async function closeSession(session: string) {
  await run(session, ["close"]).catch(() => undefined);
}

/** 把正则转成可序列化进页面脚本的 [source, flags]。 */
export function serializeRegex(pattern: RegExp) {
  return JSON.stringify([pattern.source, pattern.flags]);
}
