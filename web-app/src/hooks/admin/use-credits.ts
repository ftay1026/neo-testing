import { useState, useEffect, useCallback } from 'react';

// =====================================================
// TYPES
// =====================================================

export interface ExpiringCredit {
  customer_id: string;
  email: string;
  full_name: string;
  credits: number;
  expires_at: string;
  days_left: number;
}

interface UseExpiringCreditsReturn {
  credits: ExpiringCredit[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseTotalExpiringCreditsReturn {
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseTotalPositiveCreditsReturn {
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseExtendCreditExpiryReturn {
  extendExpiry: (customer_id: string, new_expiry: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

interface UseAddCreditsReturn {
  addCredits: (customer_id: string, amount: number, description: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

// =====================================================
// HOOK 1: useExpiringCredits
// Get list of expiring credits with customer details
// =====================================================

export function useExpiringCredits(daysThreshold: number = 100): UseExpiringCreditsReturn {
  const [credits, setCredits] = useState<ExpiringCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/credits/expiring?days=${daysThreshold}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expiring credits');
      }
      
      const data = await response.json();
      setCredits(data.credits || []);
    } catch (err) {
      console.error('Error fetching expiring credits:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [daysThreshold]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, loading, error, refetch: fetchCredits };
}

// =====================================================
// HOOK 2: useTotalExpiringCredits
// Get sum of all expiring credits
// =====================================================

export function useTotalExpiringCredits(daysThreshold: number = 30): UseTotalExpiringCreditsReturn {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/credits/expiring/total?days=${daysThreshold}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch total expiring credits');
      }
      
      const data = await response.json();
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching total expiring credits:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [daysThreshold]);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  return { total, loading, error, refetch: fetchTotal };
}

// =====================================================
// HOOK 3: useTotalPositiveCredits
// Get sum of all positive credit transactions
// =====================================================

export function useTotalPositiveCredits(): UseTotalPositiveCreditsReturn {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/credits/total-positive');
      
      if (!response.ok) {
        throw new Error('Failed to fetch total positive credits');
      }
      
      const data = await response.json();
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching total positive credits:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  return { total, loading, error, refetch: fetchTotal };
}



// =====================================================
// HOOK 4: useExtendCreditExpiry
// Extend credit expiration for a specific customer
// =====================================================


export function useExtendCreditExpiry(): UseExtendCreditExpiryReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extendExpiry(customer_id: string, new_expiry: string): Promise<boolean> {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/credits/extend-expiration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id,
          new_expiry
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update expiry');
      }

      return true; // success
    } catch (err) {
      console.error('Error updating expiry:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { extendExpiry, loading, error };
}


// =====================================================
// HOOK 5: useAddCredits
// giving credits for a specific customer
// =====================================================


export function useAddCredits(): UseAddCreditsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCredits = useCallback(async (customer_id: string, amount: number, description: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/credits/gift-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id, amount, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to add credits");
      }

      return true;
    } catch (err) {
      console.error("Error adding credits:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addCredits, loading, error };
}