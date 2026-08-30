import { updateSearchHistory } from "@/lib/jobs/search-history-storage";
import { updateSearchHistoryRequestSchema } from "@/schemas/search-history";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = updateSearchHistoryRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "搜索历史更新参数无效" },
      { status: 400 },
    );
  }

  try {
    const { id } = await context.params;
    return Response.json({ data: await updateSearchHistory(id, parsed.data) });
  } catch (error) {
    if (error instanceof Error && error.message === "搜索历史不存在") {
      return Response.json({ error: error.message }, { status: 404 });
    }
    console.error("更新搜索历史失败", error);
    return Response.json({ error: "更新搜索历史失败" }, { status: 500 });
  }
}
