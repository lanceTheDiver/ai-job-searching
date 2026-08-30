import "server-only";

import { z } from "zod";

const DEFAULT_OMNIROUTE_BASE_URL = "http://localhost:20128/v1";

type OmniRouteErrorCode = "CONFIGURATION" | "PROVIDER" | "INVALID_OUTPUT";

type OmniRouteResponse = {
  error?: { message?: string };
  output?: Array<{
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

type StructuredOutputRequest<T> = {
  schema: z.ZodType<T>;
  schemaName: string;
  instructions: string;
  input: string;
  operationName: string;
  resultName: string;
};

export class OmniRouteError extends Error {
  constructor(
    message: string,
    public readonly code: OmniRouteErrorCode,
  ) {
    super(message);
    this.name = "OmniRouteError";
  }
}

function getOutputText(
  response: OmniRouteResponse,
  operationName: string,
): string {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal") {
        throw new OmniRouteError(
          content.refusal ?? `模型拒绝了本次${operationName}`,
          "PROVIDER",
        );
      }
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new OmniRouteError(
    `模型没有返回可解析的${operationName}结果`,
    "INVALID_OUTPUT",
  );
}

async function parseResponse(response: Response): Promise<OmniRouteResponse> {
  try {
    return (await response.json()) as OmniRouteResponse;
  } catch {
    throw new OmniRouteError(
      response.ok
        ? "OmniRoute 返回了无法解析的响应"
        : "OmniRoute 服务暂时不可用",
      response.ok ? "INVALID_OUTPUT" : "PROVIDER",
    );
  }
}

export async function requestOmniRouteStructuredOutput<T>({
  schema,
  schemaName,
  instructions,
  input,
  operationName,
  resultName,
}: StructuredOutputRequest<T>): Promise<T> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  if (!apiKey) {
    throw new OmniRouteError(
      "缺少 OMNIROUTE_API_KEY，请先在 .env.local 中配置",
      "CONFIGURATION",
    );
  }

  const baseUrl = (
    process.env.OMNIROUTE_BASE_URL ?? DEFAULT_OMNIROUTE_BASE_URL
  ).replace(/\/+$/, "");
  const jsonSchema = z.toJSONSchema(schema, {
    target: "draft-7",
    reused: "inline",
  });

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OMNIROUTE_MODEL ?? "auto",
        store: false,
        instructions,
        input,
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema: jsonSchema,
          },
        },
      }),
    });
  } catch {
    throw new OmniRouteError(
      `无法连接 OmniRoute，请确认服务已启动：${baseUrl}`,
      "PROVIDER",
    );
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new OmniRouteError(
      payload.error?.message ?? "OmniRoute 服务暂时不可用",
      "PROVIDER",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(getOutputText(payload, operationName));
  } catch (error) {
    if (error instanceof OmniRouteError) throw error;
    throw new OmniRouteError("模型返回的内容不是有效 JSON", "INVALID_OUTPUT");
  }

  const validated = schema.safeParse(parsedJson);
  if (!validated.success) {
    throw new OmniRouteError(`${resultName}未通过 Zod 校验`, "INVALID_OUTPUT");
  }
  return validated.data;
}
