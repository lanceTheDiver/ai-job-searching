import {
  deriveJobSearchCriteria,
  JobSearchCriteriaError,
} from "@/lib/ai/derive-job-search-criteria";
import { JobRankingError, rankJobs } from "@/lib/ai/rank-jobs";
import {
  BOSS_LOGIN_URL,
  BossSearchError,
  searchBossJobs,
} from "@/lib/boss/search-jobs";
import type { SearchableJob } from "@/lib/jobs/types";
import {
  LinkedInSearchError,
  searchLinkedInJobs,
} from "@/lib/linkedin/search-jobs";
import {
  linkedInJobSearchRequestSchema,
  type JobSearchNotice,
} from "@/schemas/job-search";

export const runtime = "nodejs";

function getBossKeywords(
  keywords: string,
  workplace: "any" | "remote" | "hybrid" | "onsite",
) {
  if (workplace === "remote") return `${keywords} 远程`;
  if (workplace === "hybrid") return `${keywords} 混合办公`;
  return keywords;
}

function noticeForBossError(error: unknown): JobSearchNotice {
  if (error instanceof BossSearchError) {
    return {
      source: "boss",
      code:
        error.code === "AUTH_REQUIRED"
          ? "AUTH_REQUIRED"
          : error.code === "BROWSER_UNAVAILABLE"
            ? "BROWSER_UNAVAILABLE"
            : error.code === "EMPTY_RESULT"
              ? "EMPTY_RESULT"
              : "SOURCE_UNAVAILABLE",
      message: error.message,
      ...(error.code === "AUTH_REQUIRED" && { actionUrl: BOSS_LOGIN_URL }),
    };
  }
  console.error("搜索 Boss 直聘岗位时发生未知错误", error);
  return {
    source: "boss",
    code: "SOURCE_UNAVAILABLE",
    message: "Boss 直聘暂时无法搜索，请稍后重试。",
  };
}

function noticeForLinkedInError(error: unknown): JobSearchNotice {
  if (error instanceof LinkedInSearchError) {
    return {
      source: "linkedin",
      code: error.message.startsWith("没有找到")
        ? "EMPTY_RESULT"
        : "SOURCE_UNAVAILABLE",
      message: error.message,
    };
  }
  console.error("搜索 LinkedIn 岗位时发生未知错误", error);
  return {
    source: "linkedin",
    code: "SOURCE_UNAVAILABLE",
    message: "LinkedIn 暂时无法搜索，请稍后重试。",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求体必须是有效 JSON" }, { status: 400 });
  }

  const parsed = linkedInJobSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "搜索条件不符合要求" },
      { status: 400 },
    );
  }

  try {
    const criteria = await deriveJobSearchCriteria(
      parsed.data.resumeText,
      parsed.data.workplace,
    );
    const [linkedInSearch, bossSearch] = await Promise.allSettled([
      searchLinkedInJobs({
        keywords: criteria.keywords,
        location:
          parsed.data.workplace === "remote"
            ? "Remote"
            : (criteria.location ?? "Worldwide"),
        workplace: parsed.data.workplace,
      }),
      searchBossJobs({
        keywords: getBossKeywords(criteria.bossKeywords, parsed.data.workplace),
        city: criteria.bossCity,
      }),
    ]);

    const jobs: SearchableJob[] = [];
    const notices: JobSearchNotice[] = [];
    if (linkedInSearch.status === "fulfilled") {
      jobs.push(...linkedInSearch.value);
    } else {
      notices.push(noticeForLinkedInError(linkedInSearch.reason));
    }
    if (bossSearch.status === "fulfilled") {
      jobs.push(...bossSearch.value);
    } else {
      notices.push(noticeForBossError(bossSearch.reason));
    }

    if (jobs.length === 0) {
      return Response.json({ data: [], notices });
    }

    const ranking = await rankJobs(parsed.data.resumeText, jobs);
    const rankingById = new Map(ranking.jobs.map((job) => [job.id, job]));
    const results = jobs
      .map((job) => {
        const match = rankingById.get(job.id);
        return {
          id: job.id,
          source: job.source,
          title: job.title,
          company: job.company,
          location: job.location,
          postedAt: job.postedAt,
          salary: job.salary,
          url: job.url,
          matchScore: match?.matchScore ?? 0,
          summary:
            match?.summary ??
            "岗位已成功获取，但 AI 暂未返回该岗位的匹配分析。",
          matchedSkills: match?.matchedSkills ?? [],
          missingSkills: match?.missingSkills ?? [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return Response.json({ data: results, notices });
  } catch (error) {
    if (
      error instanceof JobSearchCriteriaError ||
      error instanceof JobRankingError
    ) {
      return Response.json(
        { error: error.message },
        { status: error.code === "CONFIGURATION" ? 503 : 502 },
      );
    }
    console.error("搜索岗位时发生未知错误", error);
    return Response.json(
      { error: "岗位搜索失败，请稍后再试" },
      { status: 500 },
    );
  }
}
