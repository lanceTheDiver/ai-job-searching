import {
  getApplicationRecord,
  updateApplicationRecord,
} from "@/lib/applications/application-storage";
import {
  cancelLinkedInApplication,
  confirmLinkedInApplication,
  continueLinkedInApplication,
} from "@/lib/linkedin/application-automation";
import { applicationActionRequestSchema } from "@/schemas/application";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = applicationActionRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "投递操作参数无效" },
      { status: 400 },
    );
  }

  const record = await getApplicationRecord(parsed.data.id);
  if (!record) {
    return Response.json({ error: "投递记录不存在" }, { status: 404 });
  }

  try {
    if (parsed.data.action === "cancel") {
      if (record.status === "submitted" || record.status === "cancelled") {
        return Response.json(
          { error: "当前投递状态不能取消" },
          { status: 409 },
        );
      }
      await cancelLinkedInApplication(record.id);
      const updated = await updateApplicationRecord(record.id, {
        status: "cancelled",
        statusMessage: "已取消本次辅助投递，没有提交申请",
      });
      return Response.json({ data: updated });
    }

    if (
      parsed.data.action === "confirm" &&
      record.status !== "awaiting_confirmation"
    ) {
      return Response.json(
        { error: "申请尚未到达最终确认步骤，未执行提交" },
        { status: 409 },
      );
    }

    if (
      parsed.data.action === "continue" &&
      record.status !== "awaiting_login" &&
      record.status !== "needs_attention"
    ) {
      return Response.json(
        { error: "当前投递状态不需要继续填写" },
        { status: 409 },
      );
    }

    const result =
      parsed.data.action === "confirm"
        ? await confirmLinkedInApplication(record.id)
        : await continueLinkedInApplication(record.id);
    const updated = await updateApplicationRecord(record.id, {
      status: result.status,
      statusMessage: result.message,
      submittedAt:
        result.status === "submitted" ? new Date().toISOString() : null,
    });
    return Response.json({ data: updated });
  } catch (error) {
    console.error("执行 LinkedIn 投递操作失败", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "执行投递操作失败，请重试",
      },
      { status: 500 },
    );
  }
}
