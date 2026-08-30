import type {
  ApplicationActionRequest,
  ApplicationRecord,
  PrepareApplicationRequest,
} from "@/schemas/application";

type ApplicationResponse = {
  data?: ApplicationRecord;
  error?: string;
};

async function readApplicationResponse(response: Response) {
  const payload = (await response.json()) as ApplicationResponse;
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "投递操作失败");
  }
  return payload.data;
}

export async function prepareApplication(input: PrepareApplicationRequest) {
  return readApplicationResponse(
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function performApplicationAction(
  input: ApplicationActionRequest,
) {
  return readApplicationResponse(
    await fetch("/api/applications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchApplicationRecords() {
  const response = await fetch("/api/applications", { cache: "no-store" });
  const payload = (await response.json()) as {
    data?: ApplicationRecord[];
    error?: string;
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "读取投递记录失败");
  }
  return payload.data;
}
