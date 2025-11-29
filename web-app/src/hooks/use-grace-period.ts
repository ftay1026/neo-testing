import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

interface GracePeriodBatch {
  id: string;
  remaining_credits: number;
  description: string;
  created_at: string;
  expires_at: string;
  grace_period_ends_at: string;
  days_remaining: number;
}

interface GracePeriodData {
  has_grace_credits: boolean;
  total_credits: number;
  min_days_remaining: number;
  batch_count: number;
  batches: GracePeriodBatch[];
}

export function useGracePeriod() {
  const { data, error, mutate } = useSWR<GracePeriodData>(
    '/api/grace-period',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    graceData: data,
    hasGraceCredits: data?.has_grace_credits ?? false,
    totalExpiring: data?.total_credits ?? 0,
    daysRemaining: data?.min_days_remaining ?? 0,
    batches: data?.batches ?? [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}