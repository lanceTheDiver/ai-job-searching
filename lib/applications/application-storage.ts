"server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  applicationRecordSchema,
  type ApplicationRecord,
  type ApplicationStatus,
  type PrepareApplicationRequest,
} from "@/schemas/application";

const STORAGE_DIRECTORY = resolve(
  process.env.APPLICATION_STORAGE_DIR ||
    join(process.cwd(), ".data", "applications"),
);
const STORAGE_FILE = join(STORAGE_DIRECTORY, "records.json");

let writeQueue = Promise.resolve();

async function readRecords() {
  try {
    const value = JSON.parse(await readFile(STORAGE_FILE, "utf8")) as unknown;
    return applicationRecordSchema.array().parse(value);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecords(records: ApplicationRecord[]) {
  await mkdir(STORAGE_DIRECTORY, { recursive: true, mode: 0o700 });
  const temporaryFile = join(STORAGE_DIRECTORY, `records-${randomUUID()}.tmp`);
  await writeFile(temporaryFile, JSON.stringify(records, null, 2), {
    mode: 0o600,
  });
  await rename(temporaryFile, STORAGE_FILE);
}

async function mutateRecords<T>(
  mutation: (records: ApplicationRecord[]) => T | Promise<T>,
) {
  let result!: T;
  const operation = writeQueue.then(async () => {
    const records = await readRecords();
    result = await mutation(records);
    await writeRecords(records);
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
  return result;
}

export async function listApplicationRecords() {
  await writeQueue;
  return (await readRecords()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function createApplicationRecord(
  input: PrepareApplicationRequest,
) {
  return mutateRecords((records) => {
    const now = new Date().toISOString();
    const record: ApplicationRecord = {
      id: randomUUID(),
      jobId: input.job.id,
      source: input.job.source,
      jobTitle: input.job.title,
      company: input.job.company,
      location: input.job.location,
      postedAt: input.job.postedAt,
      salary: input.job.salary,
      jobUrl: input.job.url,
      matchScore: input.job.matchScore,
      resumeFileId: input.resumeFileId,
      resumeFileName: input.resumeFileName,
      status: "preparing",
      statusMessage: "正在打开 LinkedIn 并准备申请表单",
      startedAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    records.unshift(record);
    return record;
  });
}

export async function getApplicationRecord(id: string) {
  await writeQueue;
  return (await readRecords()).find((record) => record.id === id) ?? null;
}

export async function findCurrentApplication(jobId: string) {
  await writeQueue;
  return (
    (await readRecords()).find(
      (record) =>
        record.jobId === jobId &&
        !["failed", "cancelled"].includes(record.status),
    ) ?? null
  );
}

export async function updateApplicationRecord(
  id: string,
  update: {
    status: ApplicationStatus;
    statusMessage: string;
    submittedAt?: string | null;
  },
) {
  return mutateRecords((records) => {
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error("投递记录不存在");
    const record: ApplicationRecord = {
      ...records[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    records[index] = record;
    return record;
  });
}
