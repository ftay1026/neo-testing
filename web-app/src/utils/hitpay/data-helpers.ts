// utils/hitpay/data-helpers.ts
export function parseHitPayResponse<T>(response: T): T {
  return JSON.parse(JSON.stringify(response));
}

export const HitPayErrorMessage = 'Something went wrong with HitPay, please try again later';

export function getHitPayErrorMessage() {
  return { error: HitPayErrorMessage, data: [], hasMore: false, totalRecords: 0 };
}