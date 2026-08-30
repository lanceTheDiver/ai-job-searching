import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

import { saveResumePdf } from "@/lib/resumes/resume-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RESUME_LENGTH = 30_000;
const SVG_PATH_CHARS = /^[\d\s.,+\-MmZzLlHhVvCcSsQqTtAaEe]+$/;
const SVG_PATH_FRAGMENT =
  /[MmZzLlHhVvCcSsQqTtAa][\d\s.,+\-MmZzLlHhVvCcSsQqTtAaEe]{59,}/g;

export const runtime = "nodejs";

PDFParse.setWorker(getPath());

function looksLikeSvgPath(value: string) {
  const candidate = value
    .trim()
    .replace(/^d=["']/, "")
    .replace(/["']>$/, "");
  if (candidate.length < 60 || !SVG_PATH_CHARS.test(candidate)) return false;

  const commands = candidate.match(/[MmZzLlHhVvCcSsQqTtAa]/g)?.length ?? 0;
  const digits = candidate.match(/\d/g)?.length ?? 0;
  return commands >= 2 && digits >= 24;
}

function cleanResumeText(value: string) {
  return value
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "\n")
    .replace(/<path\b[\s\S]*?>/gi, "\n")
    .replace(SVG_PATH_FRAGMENT, (fragment) =>
      looksLikeSvgPath(fragment) ? "\n" : fragment,
    )
    .split("\n")
    .filter((line) => !looksLikeSvgPath(line))
    .join("\n")
    .replace(/^\s*["']>\s*/gm, "")
    .replace(/(?<=[\p{Script=Han}])[\t ]+(?=[\p{Script=Han}])/gu, "")
    .replace(/[\t ]+([，。；：！？、])/g, "$1")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replaceAll("\u0000", "")
    .trim();
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "上传内容格式无效" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请选择要上传的 PDF 简历" }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: "上传的 PDF 文件为空" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "PDF 文件不能超过 10 MB" }, { status: 413 });
  }
  if (file.type && file.type !== "application/pdf") {
    return Response.json({ error: "仅支持 PDF 格式的简历" }, { status: 415 });
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const signature = new TextDecoder("ascii").decode(data.subarray(0, 5));
  if (signature !== "%PDF-") {
    return Response.json({ error: "文件不是有效的 PDF" }, { status: 415 });
  }

  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText({ pageJoiner: "" });
    const text = cleanResumeText(result.text);

    if (!text) {
      return Response.json(
        { error: "没有从 PDF 中提取到文字，请上传包含可选中文本的简历" },
        { status: 422 },
      );
    }
    if (text.length > MAX_RESUME_LENGTH) {
      return Response.json(
        { error: "解析后的简历内容超过 30,000 个字符，请精简后重试" },
        { status: 422 },
      );
    }

    let storedFile;
    try {
      storedFile = await saveResumePdf(data, file.name);
    } catch (error) {
      console.error("PDF 简历保存失败", error);
      return Response.json(
        { error: "PDF 已解析，但原始文件保存失败，请重新上传" },
        { status: 500 },
      );
    }

    return Response.json({
      data: {
        text,
        fileName: file.name,
        pageCount: result.total,
        fileId: storedFile.id,
        fileSize: storedFile.size,
        uploadedAt: storedFile.uploadedAt,
      },
    });
  } catch (error) {
    console.error("PDF 解析失败", error);
    return Response.json(
      { error: "PDF 解析失败，文件可能已损坏或受到密码保护" },
      { status: 422 },
    );
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
