import type { NextApiRequest, NextApiResponse } from "next";

import { pushPromptLive, PushPromptParams } from "@/lib/lab/github";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body as Partial<PushPromptParams> | undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const system = typeof body?.system === "string" ? body.system : "";
  const id = typeof body?.id === "string" ? body.id.trim() : undefined;

  if (!name || !system) {
    response.status(400).json({ error: "name and system are required" });
    return;
  }

  try {
    const result = await pushPromptLive({ id, name, system });
    response.status(200).json(result);
  } catch (error) {
    console.error("pages/api/lab/push error", error);
    response.status(500).json({ error: (error as Error).message });
  }
}
