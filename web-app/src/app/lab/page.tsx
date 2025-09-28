"use client";

import { FormEvent, useState } from "react";
import { AVAILABLE_MODELS, RunResult } from "@/lib/lab/models";
import { runComparison } from "@/lib/lab/run";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";
const DEFAULT_TEMPERATURE = "1";
const DEFAULT_MAX_TOKENS = "512";

type VoteChoice = "A" | "B" | "Tie";

export default function LabPage() {
  const [systemA, setSystemA] = useState(DEFAULT_SYSTEM_PROMPT);
  const [systemB, setSystemB] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState("");
  const [modelA, setModelA] = useState(AVAILABLE_MODELS[0]?.id ?? "");
  const [modelB, setModelB] = useState(AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? "");
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);

  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vote, setVote] = useState<VoteChoice | null>(null);
  const [notes, setNotes] = useState("");

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
      setError(err instanceof Error ? err.message : "Failed to run comparison");
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
              min="1"
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Running..." : "Run comparison"}
          </button>
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
        </div>
      </form>

      {result ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Results</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Model A: {modelA}</h3>
                <div className="text-xs text-muted-foreground">
                  <div>Tokens: {result.a.tokens}</div>
                  <div>Latency: {result.a.ms}ms</div>
                </div>
              </header>
              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-card-foreground">
                {result.a.text || "(No output)"}
              </pre>
            </article>
            <article className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Model B: {modelB}</h3>
                <div className="text-xs text-muted-foreground">
                  <div>Tokens: {result.b.tokens}</div>
                  <div>Latency: {result.b.ms}ms</div>
                </div>
              </header>
              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-card-foreground">
                {result.b.text || "(No output)"}
              </pre>
            </article>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Vote</h2>
        <div className="flex flex-wrap items-center gap-3">
          {["A", "B", "Tie"].map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => handleVote(choice as VoteChoice)}
              className={`rounded-md border px-3 py-1 text-sm font-medium shadow-sm transition ${
                vote === choice
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              }`}
            >
              Vote {choice}
            </button>
          ))}
          <button
            type="button"
            onClick={logVote}
            className="rounded-md border border-border bg-background px-3 py-1 text-sm font-medium shadow-sm"
          >
            Log vote
          </button>
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </section>
    </div>
  );
}
