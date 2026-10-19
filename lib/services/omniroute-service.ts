import "server-only";

import { spawn } from "node:child_process";

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

async function requestOmniRouteJson<T>({
  schema,
  schemaName,
  instructions,
  input,
  operationName,
}: StructuredOutputRequest<T>): Promise<unknown> {
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

  try {
    return JSON.parse(getOutputText(payload, operationName));
  } catch (error) {
    if (error instanceof OmniRouteError) throw error;
    throw new OmniRouteError("模型返回的内容不是有效 JSON", "INVALID_OUTPUT");
  }
}

// 走本机 Claude Code 登录态（订阅额度），不需要 API Key。
async function requestClaudeJson<T>({
  schema,
  instructions,
  input,
}: StructuredOutputRequest<T>): Promise<unknown> {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(
      z.toJSONSchema(schema, { target: "draft-7", reused: "inline" }),
    ),
    "--tools",
    "",
    "--no-session-persistence",
    "--setting-sources",
    "",
    "--system-prompt",
    instructions,
  ];
  if (process.env.CLAUDE_MODEL) args.push("--model", process.env.CLAUDE_MODEL);

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn("claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 180_000,
    });
    let out = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    child.on("error", () =>
      reject(
        new OmniRouteError(
          "无法启动 claude 命令，请确认已安装 Claude Code 并完成登录",
          "CONFIGURATION",
        ),
      ),
    );
    child.on("close", () => resolve(out));
    child.stdin.end(input);
  });

  let result: {
    is_error?: boolean;
    result?: string;
    structured_output?: unknown;
  };
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new OmniRouteError("Claude 没有返回可解析的响应", "PROVIDER");
  }
  if (result.is_error) {
    throw new OmniRouteError(result.result ?? "Claude 调用失败", "PROVIDER");
  }
  if (result.structured_output === undefined) {
    throw new OmniRouteError("Claude 没有返回结构化结果", "INVALID_OUTPUT");
  }
  return result.structured_output;
}

// LLM_PROVIDER=claude 使用 Claude 订阅，默认使用 OmniRoute。
export async function requestOmniRouteStructuredOutput<T>(
  request: StructuredOutputRequest<T>,
): Promise<T> {
  const json =
    process.env.LLM_PROVIDER === "claude"
      ? await requestClaudeJson(request)
      : await requestOmniRouteJson(request);

  const validated = request.schema.safeParse(json);
  if (!validated.success) {
    throw new OmniRouteError(
      `${request.resultName}未通过 Zod 校验`,
      "INVALID_OUTPUT",
    );
  }
  return validated.data;
}
