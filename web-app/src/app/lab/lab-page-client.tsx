"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AVAILABLE_MODELS, RunResult } from "@/lib/lab/models";
import { runComparison } from "@/lib/lab/run";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";
const DEFAULT_TEMPERATURE = "1";
const DEFAULT_MAX_TOKENS = "512";

type VoteChoice = "A" | "B" | "Tie";
type PromptSource = "A" | "B";

export default function LabPageClient() {
  const [systemA, setSystemA] = useState(DEFAULT_SYSTEM_PROMPT);
  const [systemB, setSystemB] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState("");
  const [modelA, setModelA] = useState(AVAILABLE_MODELS[0]?.id ?? "");
  const [modelB, setModelB] = useState(
    AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? "",
  );
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);

  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vote, setVote] = useState<VoteChoice | null>(null);
  const [notes, setNotes] = useState("");
  const [pushSource, setPushSource] = useState<PromptSource>("A");
  const [pushName, setPushName] = useState("");
  const [pushId, setPushId] = useState("");
  const [pushing, setPushing] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      systemA,
      systemB,
      user: userPrompt,
      modelA,
      modelB,
      temperature: temperature ? Number(temperature) : undefined,
      max_tokens: maxTokens ? Number(maxTokens) : undefined,
    };

    try {
      const response = await runComparison(payload);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to run comparison",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (choice: VoteChoice) => {
    setVote(choice);
  };

  const logVote = () => {
    if (!vote) {
      console.log("Prompt Lab vote skipped", { notes });
      return;
    }

    console.log("Prompt Lab vote", {
      vote,
      notes,
      models: { modelA, modelB },
    });
  };

  const handlePush = async () => {
    const trimmedName = pushName.trim();
    const trimmedId = pushId.trim();
    const systemToPush = pushSource === "A" ? systemA : systemB;

    if (!trimmedName) {
      toast.error("Prompt name is required to push");
      return;
    }

    if (!systemToPush.trim()) {
      toast.error("The selected system prompt is empty");
      return;
    }

    setPushing(true);

    try {
      const response = await fetch("/api/lab/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trimmedId ? trimmedId : undefined,
          name: trimmedName,
          system: systemToPush,
        }),
      });

      let data: unknown = null;

      try {
        data = await response.json();
      } catch (error) {
        // Ignore JSON parsing errors; response may be empty on failure
      }

      if (!response.ok || !data || typeof data !== "object") {
        const message =
          typeof (data as { error?: string })?.error === "string"
            ? (data as { error: string }).error
            : `Failed to push prompt (${response.status})`;
        toast.error(message);
        return;
      }

      const prUrl = (data as { prUrl?: string }).prUrl;

      if (!prUrl) {
        toast.error("Prompt push succeeded but no PR URL was returned");
        return;
      }

      toast.success("Prompt push PR created", {
        action: {
          label: "View PR",
          onClick: () => {
            window.open(prUrl, "_blank", "noopener,noreferrer");
          },
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to push prompt",
      );
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Prompt Lab</h1>
        <p className="text-muted-foreground">
          Compare two system prompts and models side-by-side. If you do not
          configure API keys, mocked responses will be returned so you can keep
          iterating in development.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-medium">System Prompt A</span>
            <textarea
              value={systemA}
              onChange={(event) => setSystemA(event.target.value)}
              rows={6}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">System Prompt B</span>
            <textarea
              value={systemB}
              onChange={(event) => setSystemB(event.target.value)}
              rows={6}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-medium">User Prompt</span>
          <textarea
            value={userPrompt}
            onChange={(event) => setUserPrompt(event.target.value)}
            rows={4}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-medium">Model A</span>
            <select
              value={modelA}
              onChange={(event) => setModelA(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} ({model.vendor})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Model B</span>
            <select
              value={modelB}
              onChange={(event) => setModelB(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} ({model.vendor})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-medium">Temperature (0 – 2)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Max tokens</span>
            <input
              type="number"
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Comparing..." : "Run comparison"}
        </button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="space-y-4">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold">Results</h2>
            <p className="text-muted-foreground">
              Review the responses and record which option performed better.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {result.comparisons.map((comparison, index) => (
              <article
                key={comparison.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <header className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-medium">Comparison {index + 1}</h3>
                  <span className="text-xs text-muted-foreground">
                    Model: {comparison.model}
                  </span>
                </header>
                <div className="space-y-2">
                  <section>
                    <h4 className="text-sm font-semibold">Response A</h4>
                    <p className="text-sm text-muted-foreground">
                      {comparison.responseA}
                    </p>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold">Response B</h4>
                    <p className="text-sm text-muted-foreground">
                      {comparison.responseB}
                    </p>
                  </section>
                </div>
              </article>
            ))}
          </div>

          <footer className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Which response was better?</span>
              <div className="flex gap-2">
                {[
                  { choice: "A" as VoteChoice, label: "Response A" },
                  { choice: "B" as VoteChoice, label: "Response B" },
                  { choice: "Tie" as VoteChoice, label: "Tie" },
                ].map(({ choice, label }) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleVote(choice)}
                    className={`rounded-md border px-3 py-1 text-sm transition ${
                      vote === choice
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-medium">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Record any insights or follow-up ideas"
              />
            </label>

            <button
              type="button"
              onClick={logVote}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
            >
              Log vote
            </button>
          </footer>
        </section>
      )}

      <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-lg font-medium">Push prompt live</h2>
          <p className="text-sm text-muted-foreground">
            Create a GitHub PR that updates <code>config/prompts.json</code> with
            the selected system prompt.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-medium">System prompt to push</span>
            <div className="flex flex-wrap gap-2">
              {([
                { source: "A" as PromptSource, label: "System Prompt A" },
                { source: "B" as PromptSource, label: "System Prompt B" },
              ]).map(({ source, label }) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setPushSource(source)}
                  className={`rounded-md border px-3 py-1 text-sm transition ${
                    pushSource === source
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-medium">Prompt name</span>
            <input
              type="text"
              value={pushName}
              onChange={(event) => setPushName(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Support agent v2"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-medium">Prompt ID (optional)</span>
            <input
              type="text"
              value={pushId}
              onChange={(event) => setPushId(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Existing prompt ID if updating"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handlePush}
          disabled={pushing}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pushing ? "Pushing..." : "Push to GitHub"}
        </button>
      </section>
    </div>
  );
}
