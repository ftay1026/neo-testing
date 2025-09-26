export interface IBillingFrequency {
  value: string;
  label: string;
  priceSuffix: string;
}

export const BillingFrequency: IBillingFrequency[] = [
  { value: 'one-time', label: 'One-time', priceSuffix: 'One time payment' },
];