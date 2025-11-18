// Credit calculation based on Anthropic's pricing and a margin multiplier.
// CREDIT_VALUE is the value of one credit in USD.
// INPUT_RATE and OUTPUT_RATE are the costs per token in USD.
// MARGIN_MULTIPLIER is used to add a safety margin to the calculated credits.
// const CREDIT_VALUE = parseFloat(process.env.CREDIT_VALUE || '0.008');
// const INPUT_RATE = parseFloat(process.env.ANTHROPIC_INPUT_RATE || '0.000003');
// const OUTPUT_RATE = parseFloat(process.env.ANTHROPIC_OUTPUT_RATE || '0.000015');
// const MARGIN_MULTIPLIER = parseFloat(process.env.CREDIT_MARGIN_MULTIPLIER || '1.5');

interface BillingSettings {
  credit_value: number;
  input_rate: number;
  output_rate: number;
  margin_multiplier: number;
}

interface CreditCalculationResult {
  total_cost: number;
  required_credits: number;
}

// Updated function to accept billing settings
export function calculateRequiredCredits(
  inputTokens: number,
  outputTokens: number,
  billingSettings: BillingSettings
): CreditCalculationResult {
  const inputCost = inputTokens * billingSettings.input_rate;
  const outputCost = outputTokens * billingSettings.output_rate;
  const totalCost = inputCost + outputCost;

  const costWithMargin = totalCost * billingSettings.margin_multiplier;
  const requiredCredits = costWithMargin / billingSettings.credit_value;

  return {
    total_cost: totalCost,
    required_credits: Math.max(1, Math.ceil(requiredCredits))
  };
}