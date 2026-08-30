import {
  createSearchHistory,
  listSearchHistory,
} from "@/lib/jobs/search-history-storage";
import { createSearchHistoryRequestSchema } from "@/schemas/search-history";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ data: await listSearchHistory() });
  } catch (error) {
    console.error("读取搜索历史失败", error);
    return Response.json({ error: "读取搜索历史失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = createSearchHistoryRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "搜索历史参数无效" },
      { status: 400 },
    );
  }

  try {
    return Response.json({ data: await createSearchHistory(parsed.data) });
  } catch (error) {
    console.error("创建搜索历史失败", error);
    return Response.json({ error: "创建搜索历史失败" }, { status: 500 });
  }
}
