export const AVAILABLE_MODELS = [
  { id: "gpt-4o-mini", vendor: "openai" },
  { id: "gpt-4o", vendor: "openai" },
];

export type RunRequest = {
  systemA: string;
  systemB: string;
  user: string;
  modelA: string;
  modelB: string;
  temperature?: number;
  max_tokens?: number;
};

export type RunResult = {
  a: { text: string; tokens: number; ms: number };
  b: { text: string; tokens: number; ms: number };
  costUSD?: number;
};
