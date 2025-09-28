import { Buffer } from "node:buffer";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const PROMPTS_PATH = "config/prompts.json";

interface PromptConfig {
  liveId: string;
  prompts: PromptDefinition[];
}

interface PromptDefinition {
  id: string;
  name: string;
  system: string;
  updatedAt: string;
}

export interface PushPromptParams {
  id?: string;
  name: string;
  system: string;
}

interface GitHubFileResponse {
  content: string;
  encoding: string;
  sha: string;
}

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

interface GitHubPullRequest {
  html_url: string;
}

class GitHubClient {
  private readonly owner: string;
  private readonly repo: string;
  private readonly token: string;

  constructor(options: { owner: string; repo: string; token: string }) {
    this.owner = options.owner;
    this.repo = options.repo;
    this.token = options.token;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string>;
      allowNotFound?: boolean;
    } = {},
  ): Promise<T | null> {
    const url = new URL(`${GITHUB_API_BASE}${path}`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "neo-testing-prompt-lab",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (options.allowNotFound && response.status === 404) {
      return null;
    }

    if (!response.ok) {
      let message = `GitHub API request failed (${response.status})`;

      try {
        const data = (await response.json()) as { message?: string };
        if (typeof data?.message === "string" && data.message.trim().length) {
          message = data.message;
        }
      } catch (error) {
        // ignore JSON parse failures; fallback to default message
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  }

  getRef(ref: string) {
    return this.request<GitHubRefResponse>(
      "GET",
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${ref}`,
    );
  }

  createRef(ref: string, sha: string) {
    return this.request(
      "POST",
      `/repos/${this.owner}/${this.repo}/git/refs`,
      {
        body: {
          ref: `refs/heads/${ref}`,
          sha,
        },
      },
    );
  }

  getFile(path: string, ref: string) {
    return this.request<GitHubFileResponse>(
      "GET",
      `/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        query: { ref },
        allowNotFound: true,
      },
    );
  }

  upsertFile(
    path: string,
    options: {
      message: string;
      content: string;
      branch: string;
      sha?: string;
    },
  ) {
    return this.request(
      "PUT",
      `/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        body: {
          message: options.message,
          content: options.content,
          branch: options.branch,
          sha: options.sha,
        },
      },
    );
  }

  createPullRequest(options: {
    title: string;
    body: string;
    head: string;
    base: string;
  }) {
    return this.request<GitHubPullRequest>(
      "POST",
      `/repos/${this.owner}/${this.repo}/pulls`,
      {
        body: options,
      },
    );
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function toSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return normalized || "prompt";
}

function formatTimestampForId(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hour = `${date.getUTCHours()}`.padStart(2, "0");
  const minute = `${date.getUTCMinutes()}`.padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}`;
}

function formatTimestampForBranch(date: Date): string {
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");
  return `${formatTimestampForId(date)}${seconds}`;
}

function decodeConfigContent(file: GitHubFileResponse): {
  config: PromptConfig;
  sha: string;
} {
  if (file.encoding !== "base64") {
    throw new Error("Unexpected encoding for prompts.json");
  }

  const buffer = Buffer.from(file.content, "base64");
  const text = buffer.toString("utf-8");

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error("config/prompts.json contains invalid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("config/prompts.json has unexpected structure");
  }

  const config = parsed as PromptConfig;

  if (!Array.isArray(config.prompts)) {
    config.prompts = [];
  }

  if (typeof config.liveId !== "string") {
    config.liveId = "";
  }

  return { config, sha: file.sha };
}

function encodeConfigContent(config: PromptConfig): string {
  const text = `${JSON.stringify(config, null, 2)}\n`;
  return Buffer.from(text, "utf-8").toString("base64");
}

export async function pushPromptLive({
  id,
  name,
  system,
}: PushPromptParams): Promise<{ prUrl: string }> {
  if (!name || !system) {
    throw new Error("Prompt name and system are required");
  }

  const repoEnv = getRequiredEnv("GITHUB_REPO");
  const token = getRequiredEnv("GITHUB_TOKEN");
  const defaultBranch = getRequiredEnv("GITHUB_DEFAULT_BRANCH");

  const [owner, repo] = repoEnv.split("/");

  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must use the format owner/repo");
  }

  const client = new GitHubClient({ owner, repo, token });
  const now = new Date();
  const slug = toSlug(name);
  const branchTimestamp = formatTimestampForBranch(now);
  const branchName = `push/prompt-${slug}-${branchTimestamp}`;
  const idTimestamp = formatTimestampForId(now);
  const promptId = id?.trim().length ? id.trim() : `${slug}-${idTimestamp}`;

  const baseRef = await client.getRef(defaultBranch);

  if (!baseRef?.object?.sha) {
    throw new Error(`Unable to resolve ${defaultBranch} branch SHA`);
  }

  await client.createRef(branchName, baseRef.object.sha);

  const existingFile = await client.getFile(PROMPTS_PATH, defaultBranch);

  let config: PromptConfig = {
    liveId: "",
    prompts: [],
  };
  let previousSha: string | undefined;

  if (existingFile) {
    const decoded = decodeConfigContent(existingFile);
    config = decoded.config;
    previousSha = decoded.sha;
  }

  const updatedPrompt: PromptDefinition = {
    id: promptId,
    name,
    system,
    updatedAt: now.toISOString(),
  };

  const index = config.prompts.findIndex((entry) => entry.id === promptId);

  if (index >= 0) {
    config.prompts[index] = updatedPrompt;
  } else {
    config.prompts.push(updatedPrompt);
  }

  config.liveId = promptId;

  const encodedContent = encodeConfigContent(config);

  await client.upsertFile(PROMPTS_PATH, {
    message: `chore: push prompt ${name}`,
    content: encodedContent,
    branch: branchName,
    sha: previousSha,
  });

  const prTitle = `Push prompt: ${name}`;
  const prBody = "Automated change from Prompt Lab to update config/prompts.json.";

  const pullRequest = await client.createPullRequest({
    title: prTitle,
    body: prBody,
    head: branchName,
    base: defaultBranch,
  });

  if (!pullRequest?.html_url) {
    throw new Error("GitHub did not return a PR URL");
  }

  return { prUrl: pullRequest.html_url };
}
