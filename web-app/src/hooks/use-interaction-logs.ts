// /hooks/use-interaction-logs.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { toast } from 'sonner';
import type { InteractionLog } from '@/types/app.types';

export function useInteractionLogs(projectId: string) {
  const { data, error, mutate, isLoading } = useSWR<InteractionLog[]>(
    projectId ? `/api/projects/${projectId}/logs` : null, 
    fetcher, 
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  const deleteLog = async (logId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/logs/${logId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete log');
      }

      // Optimistically update the cache
      mutate(
        (currentLogs) => currentLogs?.filter((log) => log.id !== logId) || [],
        false
      );
      
      toast.success('Log deleted successfully');
    } catch (error) {
      toast.error('Failed to delete log');
      throw error;
    }
  };

  // Get the last log date for display
  const lastLoggedAt = data && data.length > 0 ? data[0].created_at : null;

  return {
    logs: data ?? [],
    isLoading,
    isError: error,
    mutate,
    refetch: () => mutate(),
    deleteLog,
    lastLoggedAt,
  };
}