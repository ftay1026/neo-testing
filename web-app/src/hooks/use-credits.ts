import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export function useCredits() {
  const { data, error, mutate } = useSWR('/api/credits', fetcher, {
    refreshInterval: 0, // Only refresh on demand
    revalidateOnFocus: false,
  });

  return {
    credits: data?.credits ?? 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
} 