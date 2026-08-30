"server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const RESUME_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_ROOT = resolve(
  process.env.RESUME_STORAGE_DIR || join(process.cwd(), ".data", "resumes"),
);

export type StoredResumeReference = {
  id: string;
  fileName: string;
  size: number;
  uploadedAt: string;
};

type StoredResumeMetadata = StoredResumeReference & {
  storedFileName: string;
};

function sanitizePdfFileName(fileName: string) {
  const safeName = basename(fileName)
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, "_")
    .trim()
    .slice(0, 120);
  const normalized = safeName || "resume.pdf";
  return normalized.toLowerCase().endsWith(".pdf")
    ? normalized
    : `${normalized}.pdf`;
}

function assertResumeId(id: string) {
  if (!RESUME_ID_PATTERN.test(id)) {
    throw new Error("简历文件 ID 无效");
  }
}

export async function saveResumePdf(
  data: Uint8Array,
  originalFileName: string,
): Promise<StoredResumeReference> {
  const id = randomUUID();
  const directory = join(STORAGE_ROOT, id);
  const temporaryDirectory = join(STORAGE_ROOT, `.upload-${id}`);
  const storedFileName = sanitizePdfFileName(originalFileName);
  const uploadedAt = new Date().toISOString();
  const reference: StoredResumeReference = {
    id,
    fileName: originalFileName,
    size: data.byteLength,
    uploadedAt,
  };
  const metadata: StoredResumeMetadata = { ...reference, storedFileName };

  await mkdir(STORAGE_ROOT, { recursive: true, mode: 0o700 });
  await mkdir(temporaryDirectory, { mode: 0o700 });
  try {
    await writeFile(join(temporaryDirectory, storedFileName), data, {
      flag: "wx",
      mode: 0o600,
    });
    await writeFile(
      join(temporaryDirectory, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    await rename(temporaryDirectory, directory);
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true }).catch(
      () => undefined,
    );
    throw error;
  }

  return reference;
}

export async function getStoredResume(id: string) {
  assertResumeId(id);
  const directory = join(STORAGE_ROOT, id);
  const metadata = JSON.parse(
    await readFile(join(directory, "metadata.json"), "utf8"),
  ) as StoredResumeMetadata;

  if (metadata.id !== id || !metadata.storedFileName) {
    throw new Error("简历文件元数据无效");
  }

  return {
    reference: {
      id: metadata.id,
      fileName: metadata.fileName,
      size: metadata.size,
      uploadedAt: metadata.uploadedAt,
    } satisfies StoredResumeReference,
    filePath: join(directory, basename(metadata.storedFileName)),
  };
}
