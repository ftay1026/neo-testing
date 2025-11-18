import { useState, useEffect, useCallback } from "react";

export interface SystemLog {
  id: string;
  event_type: string;
  category: string;
  message: string;
  metadata: any;
  user_id: string | null;
  customer_id: string | null;
  created_at: string;
}

interface UseSystemLogsParams {
  eventType?: string;
  category?: string;
  customerId?: string;
  limit?: number;
  offset?: number;
}

interface UseSystemLogsReturn {
  logs: SystemLog[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemLogs(params: UseSystemLogsParams = {}): UseSystemLogsReturn {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (params.eventType) queryParams.set("event_type", params.eventType);
      if (params.category) queryParams.set("category", params.category);
      if (params.customerId) queryParams.set("customer_id", params.customerId);
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.offset) queryParams.set("offset", params.offset.toString());

      const response = await fetch(`/api/admin/system-logs?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch system logs");
      }

      const result = await response.json();
      setLogs(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error fetching system logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [params.eventType, params.category, params.customerId, params.limit, params.offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    total,
    isLoading,
    error,
    refetch: fetchLogs,
  };
}