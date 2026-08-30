"server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  searchHistoryRecordSchema,
  type CreateSearchHistoryRequest,
  type SearchHistoryRecord,
  type UpdateSearchHistoryRequest,
} from "@/schemas/search-history";

const STORAGE_DIRECTORY = resolve(
  process.env.SEARCH_HISTORY_STORAGE_DIR ||
    join(process.cwd(), ".data", "search-history"),
);
const STORAGE_FILE = join(STORAGE_DIRECTORY, "records.json");

let writeQueue = Promise.resolve();

async function readRecords() {
  try {
    const value = JSON.parse(await readFile(STORAGE_FILE, "utf8")) as unknown;
    return searchHistoryRecordSchema.array().parse(value);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecords(records: SearchHistoryRecord[]) {
  await mkdir(STORAGE_DIRECTORY, { recursive: true, mode: 0o700 });
  const temporaryFile = join(STORAGE_DIRECTORY, `${randomUUID()}.tmp`);
  await writeFile(temporaryFile, JSON.stringify(records, null, 2), {
    mode: 0o600,
  });
  await rename(temporaryFile, STORAGE_FILE);
}

async function mutateRecords<T>(
  mutation: (records: SearchHistoryRecord[]) => T,
) {
  let result!: T;
  const operation = writeQueue.then(async () => {
    const records = await readRecords();
    result = mutation(records);
    await writeRecords(records);
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
  return result;
}

export async function listSearchHistory() {
  await writeQueue;
  return (await readRecords()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function createSearchHistory(input: CreateSearchHistoryRequest) {
  return mutateRecords((records) => {
    const now = new Date().toISOString();
    const record: SearchHistoryRecord = {
      id: randomUUID(),
      workplace: input.workplace,
      resumeFileName: input.resumeFileName,
      criteria: null,
      jobs: [],
      notices: [],
      errors: [],
      completedSources: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    records.unshift(record);
    return record;
  });
}

export async function updateSearchHistory(
  id: string,
  input: UpdateSearchHistoryRequest,
) {
  return mutateRecords((records) => {
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error("搜索历史不存在");

    const current = records[index];
    const completedSources = Array.from(
      new Set([...current.completedSources, input.source]),
    );
    const now = new Date().toISOString();
    const record: SearchHistoryRecord = {
      ...current,
      criteria: input.criteria ?? current.criteria,
      jobs: [
        ...current.jobs.filter((job) => job.source !== input.source),
        ...input.jobs.filter((job) => job.source === input.source),
      ].sort((a, b) => b.matchScore - a.matchScore),
      notices: [
        ...current.notices.filter((notice) => notice.source !== input.source),
        ...input.notices.filter((notice) => notice.source === input.source),
      ],
      errors: [
        ...current.errors.filter((error) => error.source !== input.source),
        ...(input.error
          ? [{ source: input.source, message: input.error }]
          : []),
      ],
      completedSources,
      updatedAt: now,
      completedAt: completedSources.length === 2 ? now : null,
    };
    records[index] = record;
    return record;
  });
}
