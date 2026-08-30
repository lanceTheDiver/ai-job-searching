import {
  deriveJobSearchCriteria,
  JobSearchCriteriaError,
} from "@/lib/ai/derive-job-search-criteria";
import { jobSearchCriteriaRequestSchema } from "@/schemas/job-search";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = jobSearchCriteriaRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "简历内容不符合要求" },
      { status: 400 },
    );
  }

  try {
    return Response.json({
      data: await deriveJobSearchCriteria(
        parsed.data.resumeText,
        parsed.data.workplace,
      ),
    });
  } catch (error) {
    if (error instanceof JobSearchCriteriaError) {
      return Response.json(
        { error: error.message },
        { status: error.code === "CONFIGURATION" ? 503 : 502 },
      );
    }
    console.error("生成岗位搜索条件失败", error);
    return Response.json(
      { error: "无法从简历生成岗位和工作地点" },
      { status: 500 },
    );
  }
}
