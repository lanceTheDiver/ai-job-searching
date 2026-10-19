import {
  createApplicationRecord,
  findCurrentApplication,
  listApplicationRecords,
  updateApplicationRecord,
} from "@/lib/applications/application-storage";
import { prepareApplicationAutomation } from "@/lib/applications/application-automation";
import { prepareApplicationRequestSchema } from "@/schemas/application";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ data: await listApplicationRecords() });
  } catch (error) {
    console.error("读取投递记录失败", error);
    return Response.json({ error: "读取投递记录失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = prepareApplicationRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "投递参数无效" },
      { status: 400 },
    );
  }

  const currentApplication = await findCurrentApplication(parsed.data.job.id);
  if (currentApplication) {
    return Response.json(
      {
        error:
          currentApplication.status === "submitted"
            ? "该岗位已有投递记录，请勿重复投递"
            : "该岗位已有进行中的辅助投递，请前往投递记录继续处理",
      },
      { status: 409 },
    );
  }

  const record = await createApplicationRecord(parsed.data);
  try {
    const result = await prepareApplicationAutomation(record.source, {
      applicationId: record.id,
      jobUrl: record.jobUrl,
      resumeFileId: record.resumeFileId,
      resumeText: parsed.data.resumeText,
    });
    const updated = await updateApplicationRecord(record.id, {
      status: result.status,
      statusMessage: result.message,
    });
    return Response.json({ data: updated });
  } catch (error) {
    console.error("准备辅助投递失败", error);
    const message =
      error instanceof Error
        ? `辅助投递失败：${error.message}`
        : "辅助投递失败";
    const updated = await updateApplicationRecord(record.id, {
      status: "failed",
      statusMessage: message,
    });
    return Response.json({ data: updated, error: message }, { status: 502 });
  }
}
