import type {
  CreateSearchHistoryRequest,
  SearchHistoryRecord,
  UpdateSearchHistoryRequest,
} from "@/schemas/search-history";

type SearchHistoryResponse = {
  data?: SearchHistoryRecord;
  error?: string;
};

async function readRecord(response: Response) {
  const payload = (await response.json()) as SearchHistoryResponse;
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "搜索历史操作失败");
  }
  return payload.data;
}

export async function createSearchHistoryRecord(
  input: CreateSearchHistoryRequest,
) {
  return readRecord(
    await fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateSearchHistoryRecord(
  id: string,
  input: UpdateSearchHistoryRequest,
) {
  return readRecord(
    await fetch(`/api/search-history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchSearchHistoryRecords() {
  const response = await fetch("/api/search-history", { cache: "no-store" });
  const payload = (await response.json()) as {
    data?: SearchHistoryRecord[];
    error?: string;
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "读取搜索历史失败");
  }
  return payload.data;
}
