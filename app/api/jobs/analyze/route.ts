import { analyzeJob, JobAnalysisError } from "@/lib/ai/analyze-job";
import { analyzeJobRequestSchema } from "@/schemas/job";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求体必须是有效 JSON" }, { status: 400 });
  }

  const parsed = analyzeJobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "输入内容不符合要求",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeJob(parsed.data);
    return Response.json({ data: analysis });
  } catch (error) {
    if (error instanceof JobAnalysisError) {
      return Response.json(
        { error: error.message },
        { status: error.code === "CONFIGURATION" ? 503 : 502 },
      );
    }
    console.error("分析职位时发生未知错误", error);
    return Response.json({ error: "分析失败，请稍后再试" }, { status: 500 });
  }
}
