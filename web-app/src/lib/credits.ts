// Credit calculation based on Anthropic's pricing and a margin multiplier.
// CREDIT_VALUE is the value of one credit in USD.
// INPUT_RATE and OUTPUT_RATE are the costs per token in USD.
// MARGIN_MULTIPLIER is used to add a safety margin to the calculated credits.
const CREDIT_VALUE = parseFloat(process.env.CREDIT_VALUE || '0.008');
const INPUT_RATE = parseFloat(process.env.ANTHROPIC_INPUT_RATE || '0.000003');
const OUTPUT_RATE = parseFloat(process.env.ANTHROPIC_OUTPUT_RATE || '0.000015');
const MARGIN_MULTIPLIER = parseFloat(process.env.CREDIT_MARGIN_MULTIPLIER || '1.5');

export function calculateRequiredCredits(inputTokens: number, outputTokens: number): number {
  const inputCost = inputTokens * INPUT_RATE;
  const outputCost = outputTokens * OUTPUT_RATE;
  const totalCost = inputCost + outputCost;
  
  const costWithMargin = totalCost * MARGIN_MULTIPLIER;
  const requiredCredits = costWithMargin / CREDIT_VALUE;
  
  return Math.max(1, Math.ceil(requiredCredits));
}