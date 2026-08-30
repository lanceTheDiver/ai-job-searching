import {
  deriveJobSearchCriteria,
  JobSearchCriteriaError,
} from "@/lib/ai/derive-job-search-criteria";
import { JobRankingError, rankJobs } from "@/lib/ai/rank-jobs";
import {
  LinkedInSearchError,
  searchLinkedInJobs,
} from "@/lib/linkedin/search-jobs";
import { linkedInJobSearchRequestSchema } from "@/schemas/job-search";

export const runtime = "nodejs";

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
    const jobs = await searchLinkedInJobs({
      keywords: criteria.keywords,
      location:
        parsed.data.workplace === "remote"
          ? "Remote"
          : (criteria.location ?? "Worldwide"),
      workplace: parsed.data.workplace,
    });
    const ranking = await rankJobs(parsed.data.resumeText, jobs);
    const rankingById = new Map(ranking.jobs.map((job) => [job.id, job]));
    const results = jobs
      .map((job) => {
        const match = rankingById.get(job.id);
        if (!match) return null;
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          postedAt: job.postedAt,
          url: job.url,
          matchScore: match.matchScore,
          summary: match.summary,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        };
      })
      .filter((job) => job !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    return Response.json({ data: results });
  } catch (error) {
    if (error instanceof LinkedInSearchError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    if (
      error instanceof JobSearchCriteriaError ||
      error instanceof JobRankingError
    ) {
      return Response.json(
        { error: error.message },
        { status: error.code === "CONFIGURATION" ? 503 : 502 },
      );
    }
    console.error("搜索 LinkedIn 岗位时发生未知错误", error);
    return Response.json(
      { error: "岗位搜索失败，请稍后再试" },
      { status: 500 },
    );
  }
}
