"server-only";

import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

import type { SearchableJob } from "@/lib/jobs/types";

const execFileAsync = promisify(execFile);
const OPENCLI_ENTRY = join(
  process.cwd(),
  "node_modules",
  "@jackwener",
  "opencli",
  "dist",
  "src",
  "main.js",
);
const BOSS_LOGIN_URL = "https://www.zhipin.com/";

const bossSearchResultSchema = z.array(
  z
    .object({
      name: z.string().trim().min(1),
      salary: z.string().nullish(),
      company: z.string().nullish(),
      area: z.string().nullish(),
      experience: z.string().nullish(),
      degree: z.string().nullish(),
      skills: z.string().nullish(),
      boss: z.string().nullish(),
      bossOnline: z.string().nullish(),
      security_id: z.string().trim().min(1),
      url: z.url(),
    })
    .passthrough(),
);

export type BossSearchErrorCode =
  | "AUTH_REQUIRED"
  | "BROWSER_UNAVAILABLE"
  | "TIMEOUT"
  | "EMPTY_RESULT"
  | "PROVIDER_ERROR"
  | "INVALID_OUTPUT";

export class BossSearchError extends Error {
  constructor(
    message: string,
    readonly code: BossSearchErrorCode,
    readonly providerCode: string,
  ) {
    super(message);
    this.name = "BossSearchError";
  }
}

type OpenCliProcessError = Error & {
  code?: number | string;
  stderr?: string;
  stdout?: string;
  killed?: boolean;
};

function readOpenCliField(detail: string, field: "code" | "message") {
  const value = new RegExp(`^\\s{2}${field}:\\s*(.+)$`, "m")
    .exec(detail)?.[1]
    ?.trim();
  if (!value || value === "|-" || value === ">-") return null;
  return value.replace(/\u001b\[[0-9;]*m/g, "").slice(0, 180);
}

function getOpenCliFailure(error: OpenCliProcessError) {
  const detail = `${error.stderr ?? ""}\n${error.stdout ?? ""}\n${error.message}`;
  const providerCode =
    readOpenCliField(detail, "code") ??
    (typeof error.code === "number" ? `EXIT_${error.code}` : "UNKNOWN");
  return {
    detail,
    providerCode,
    providerMessage: readOpenCliField(detail, "message"),
  };
}

function withOpenCliType(
  message: string,
  providerCode: string,
  retried: boolean,
) {
  return `[OpenCLI ${providerCode}] ${message}${retried ? "（已自动重试 1 次）" : ""}`;
}

function shouldRetryOpenCliFailure(error: OpenCliProcessError) {
  const { detail } = getOpenCliFailure(error);
  return /tab (?:was )?closed|target closed|session.*detached|job-list response|did not expose.*job-?list|joblist\.json|network capture/i.test(
    detail,
  );
}

function createBossError(error: OpenCliProcessError, retried: boolean) {
  const { detail, providerCode, providerMessage } = getOpenCliFailure(error);

  if (
    error.code === 77 ||
    /AUTH_REQUIRED|请登录|未登录|登录失效|cookie.*过期/i.test(detail)
  ) {
    return new BossSearchError(
      withOpenCliType(
        "请先在 Chrome 登录 Boss 直聘，并确认 Browser Bridge 扩展已启用。",
        providerCode,
        retried,
      ),
      "AUTH_REQUIRED",
      providerCode,
    );
  }
  if (
    error.code === 69 ||
    /BROWSER_CONNECT|Browser Bridge|browser.*unavailable|extension|daemon/i.test(
      detail,
    )
  ) {
    return new BossSearchError(
      withOpenCliType(
        "无法连接 Browser Bridge，请打开 Chrome 并启用 OpenCLI 扩展。",
        providerCode,
        retried,
      ),
      "BROWSER_UNAVAILABLE",
      providerCode,
    );
  }
  if (
    error.code === 75 ||
    error.killed ||
    /timed?\s*out|timeout/i.test(detail)
  ) {
    return new BossSearchError(
      withOpenCliType("Boss 直聘搜索超时，请稍后重试。", providerCode, retried),
      "TIMEOUT",
      providerCode,
    );
  }
  if (error.code === 66) {
    return new BossSearchError(
      withOpenCliType("Boss 直聘暂未找到匹配岗位。", providerCode, retried),
      "EMPTY_RESULT",
      providerCode,
    );
  }
  return new BossSearchError(
    withOpenCliType(
      providerMessage
        ? `Boss 直聘搜索失败：${providerMessage}`
        : "Boss 直聘暂时无法搜索，请稍后重试。",
      providerCode,
      retried,
    ),
    "PROVIDER_ERROR",
    providerCode,
  );
}

async function runOpenCliBossSearch(input: { keywords: string; city: string }) {
  return execFileAsync(
    process.execPath,
    [
      OPENCLI_ENTRY,
      "boss",
      "search",
      input.keywords,
      "--city",
      input.city,
      "--limit",
      "10",
      "--format",
      "json",
      "--window",
      "background",
      "--site-session",
      "persistent",
    ],
    {
      encoding: "utf8",
      timeout: 90_000,
      maxBuffer: 2 * 1024 * 1024,
      env: {
        ...process.env,
        OPENCLI_BROWSER_CONNECT_TIMEOUT: "15",
        OPENCLI_BROWSER_COMMAND_TIMEOUT: "60",
      },
    },
  );
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

export async function searchBossJobs(input: {
  keywords: string;
  city: string;
}): Promise<SearchableJob[]> {
  let stdout = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await runOpenCliBossSearch(input);
      stdout = result.stdout;
      break;
    } catch (error) {
      const processError = error as OpenCliProcessError;
      const shouldRetry =
        attempt === 0 && shouldRetryOpenCliFailure(processError);
      if (!shouldRetry) {
        throw createBossError(processError, attempt > 0);
      }
      // 给 Browser Bridge 一点时间释放失效标签页，再进行唯一一次重试。
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  let rawResults: unknown;
  try {
    rawResults = JSON.parse(stdout);
  } catch {
    throw new BossSearchError(
      "[OpenCLI INVALID_OUTPUT] Boss 直聘返回了无法识别的数据。",
      "INVALID_OUTPUT",
      "INVALID_OUTPUT",
    );
  }

  const parsed = bossSearchResultSchema.safeParse(rawResults);
  if (!parsed.success) {
    throw new BossSearchError(
      "[OpenCLI INVALID_OUTPUT] Boss 直聘返回了无法识别的数据。",
      "INVALID_OUTPUT",
      "INVALID_OUTPUT",
    );
  }
  if (parsed.data.length === 0) {
    throw new BossSearchError(
      "[OpenCLI EMPTY_RESULT] Boss 直聘暂未找到匹配岗位。",
      "EMPTY_RESULT",
      "EMPTY_RESULT",
    );
  }

  return parsed.data.map((job) => ({
    id: `boss:${job.security_id}`,
    source: "boss",
    title: job.name,
    company: optionalText(job.company),
    location: optionalText(job.area),
    postedAt: null,
    salary: optionalText(job.salary),
    url: job.url,
    description: [
      job.experience && `经验：${job.experience}`,
      job.degree && `学历：${job.degree}`,
      job.skills && `技能：${job.skills}`,
      job.boss && `招聘者：${job.boss}`,
      job.bossOnline && `在线状态：${job.bossOnline}`,
    ]
      .filter(Boolean)
      .join("；"),
  }));
}

export { BOSS_LOGIN_URL };
