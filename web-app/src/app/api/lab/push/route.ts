import { NextResponse } from "next/server";

import { pushPromptLive, PushPromptParams } from "@/lib/lab/github";

export async function POST(request: Request) {
  let body: Partial<PushPromptParams>;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const system = typeof body?.system === "string" ? body.system : "";
  const id = typeof body?.id === "string" ? body.id.trim() : undefined;

  if (!name || !system) {
    return NextResponse.json({ error: "name and system are required" }, { status: 400 });
  }

  try {
    const result = await pushPromptLive({ id, name, system });
    return NextResponse.json(result);
  } catch (error) {
    console.error("/api/lab/push error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
