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

function createBossError(error: OpenCliProcessError) {
  const detail = `${error.stderr ?? ""}\n${error.stdout ?? ""}\n${error.message}`;

  if (
    error.code === 77 ||
    /AUTH_REQUIRED|请登录|未登录|登录失效|cookie.*过期/i.test(detail)
  ) {
    return new BossSearchError(
      "请先在 Chrome 登录 Boss 直聘，并确认 OpenCLI Browser Bridge 扩展已启用。",
      "AUTH_REQUIRED",
    );
  }
  if (
    error.code === 69 ||
    /BROWSER_CONNECT|Browser Bridge|browser.*unavailable|extension|daemon/i.test(
      detail,
    )
  ) {
    return new BossSearchError(
      "无法连接 OpenCLI Browser Bridge，请打开 Chrome 并启用 OpenCLI 扩展。",
      "BROWSER_UNAVAILABLE",
    );
  }
  if (
    error.code === 75 ||
    error.killed ||
    /timed?\s*out|timeout/i.test(detail)
  ) {
    return new BossSearchError("Boss 直聘搜索超时，请稍后重试。", "TIMEOUT");
  }
  if (error.code === 66) {
    return new BossSearchError("Boss 直聘暂未找到匹配岗位。", "EMPTY_RESULT");
  }
  return new BossSearchError(
    "Boss 直聘暂时无法搜索，请稍后重试。",
    "PROVIDER_ERROR",
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
  let stdout: string;
  try {
    const result = await execFileAsync(
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
        "foreground",
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
    stdout = result.stdout;
  } catch (error) {
    throw createBossError(error as OpenCliProcessError);
  }

  let rawResults: unknown;
  try {
    rawResults = JSON.parse(stdout);
  } catch {
    throw new BossSearchError(
      "Boss 直聘返回了无法识别的数据。",
      "INVALID_OUTPUT",
    );
  }

  const parsed = bossSearchResultSchema.safeParse(rawResults);
  if (!parsed.success) {
    throw new BossSearchError(
      "Boss 直聘返回了无法识别的数据。",
      "INVALID_OUTPUT",
    );
  }
  if (parsed.data.length === 0) {
    throw new BossSearchError("Boss 直聘暂未找到匹配岗位。", "EMPTY_RESULT");
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
