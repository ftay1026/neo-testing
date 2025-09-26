// components/checkout/hitpay-pricing-constants.ts
export interface HitPayTier {
  name: string;
  id: string; // Using string IDs for simplicity
  description: string;
  features: string[];
  featured: boolean;
  amount: number; // amount in cents
  credits: number;
  currency: string;
  savings?: string; // e.g., "Save 5%"
}

export const HitPayPricingTiers: HitPayTier[] = [
  {
    name: 'Starter',
    id: 'starter',
    description: 'Perfect for trying NEO',
    features: ['2,000 credits', 'Try NEO risk-free'],
    featured: false,
    amount: 2000, // $20.00 in cents
    credits: 2000,
    currency: 'USD',
  },
  {
    name: 'Transformation',
    id: 'transformation',
    description: 'Serious users buy in bulk',
    features: ['22,500 credits', 'Save 10%', 'Serious users buy in bulk'],
    featured: false,
    amount: 20000, // $200.00 in cents
    credits: 22500,
    currency: 'USD',
    savings: 'Save 10%',
  },
  {
    name: 'Professional',
    id: 'professional',
    description: 'Never run out mid-flow',
    features: ['62,500 credits', 'Save 20%', 'Never run out mid-flow'],
    featured: false,
    amount: 50000, // $500.00 in cents
    credits: 62500,
    currency: 'USD',
    savings: 'Save 20%',
  },
];

// Helper function to get tier by ID
export function getTierById(tierId: string): HitPayTier | undefined {
  return HitPayPricingTiers.find(tier => tier.id === tierId);
}