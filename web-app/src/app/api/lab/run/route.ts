import { NextResponse } from "next/server";
import { RunRequest, RunResult } from "@/lib/lab/models";

type ModelResponse = {
  text: string;
  tokens: number;
  ms: number;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function createMockResponse(label: string, body: RunRequest): ModelResponse {
  const ms = 400 + Math.floor(Math.random() * 800);
  const tokens = 80 + Math.floor(Math.random() * 60);
  const promptSnippet = body.user ? body.user.slice(0, 120) : "(empty user prompt)";
  const text = `Mock ${label} response for "${promptSnippet}" using ${label === "A" ? body.modelA : body.modelB}.`;
  return { text, tokens, ms };
}

async function callOpenAI(
  model: string,
  system: string,
  user: string,
  temperature: number | undefined,
  maxTokens: number | undefined,
  baseUrl: string,
  apiKey: string,
): Promise<ModelResponse> {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system ?? "" },
      { role: "user", content: user ?? "" },
    ],
  };

  if (typeof temperature === "number") {
    payload.temperature = temperature;
  }
  if (typeof maxTokens === "number") {
    payload.max_tokens = maxTokens;
  }

  const start = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const tokens: number =
    typeof data?.usage?.total_tokens === "number"
      ? data.usage.total_tokens
      : Math.max(1, Math.round(text.length / 4));

  return {
    text,
    tokens,
    ms: Date.now() - start,
  };
}

export async function POST(request: Request) {
  let body: RunRequest;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body?.modelA || !body?.modelB) {
    return NextResponse.json({ error: "modelA and modelB are required" }, { status: 400 });
  }

  const temperature = sanitizeNumber(body.temperature);
  const maxTokens = sanitizeNumber(body.max_tokens);

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    const mockResult: RunResult = {
      a: createMockResponse("A", body),
      b: createMockResponse("B", body),
      costUSD: 0,
    };
    return NextResponse.json(mockResult);
  }

  try {
    const [resultA, resultB] = await Promise.all([
      callOpenAI(body.modelA, body.systemA, body.user, temperature, maxTokens, baseUrl, apiKey),
      callOpenAI(body.modelB, body.systemB, body.user, temperature, maxTokens, baseUrl, apiKey),
    ]);

    const responseBody: RunResult = {
      a: resultA,
      b: resultB,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("/api/lab/run error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
