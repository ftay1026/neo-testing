export interface Tier {
  name: string;
  id: 'starter' | 'pro' | 'advanced';
  icon: string;
  description: string;
  features: string[];
  featured: boolean;
  priceId: Record<string, string>;
}

export const PricingTier: Tier[] = [
  {
    name: '100 Credits Pack',
    id: 'starter',
    icon: '/assets/icons/price-tiers/basic-icon.svg',
    description: 'Provides 100 AI Coaching Credits for $10 USD. Credits can be used for AI coaching sessions, queries, or recommendations. Users can purchase multiple packs as needed.',
    features: ['Ask questions', 'Receive personalized advice', 'Get recommendations'],
    featured: false,
    priceId: { 'one-time': 'pri_01jqnzjst9t4jxsrvf9ng84zj4' },
  },
];
