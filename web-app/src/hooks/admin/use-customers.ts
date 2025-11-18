import { useState, useEffect, useCallback } from 'react';

// =====================================================
// TYPES
// =====================================================

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  is_banned: boolean;
  created_at: string;
  credits: number;
  max_uses: number;
}

interface UseCustomersReturn {
  customers: Customer[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  limit: number;
  offset: number;
  setLimit: (v: number) => void;
  setOffset: (v: number) => void;
  refetch: () => Promise<void>;
  banUser: (customerId: string) => Promise<void>;
  unbanUser: (customerId: string) => Promise<void>;
}

// =====================================================
// HOOK: useCustomers
// Fetch + search + pagination + ban/unban
// =====================================================

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // Fetch customers
  // ================================
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/admin/customers?${params.toString()}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }

      setCustomers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, limit, offset]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ================================
  // Ban user
  // ================================
  const banUser = useCallback(async (customerId: string) => {
    try {

        console.log('Banning customer:', customerId)
      const response = await fetch('/api/admin/customers/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, action: 'ban' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ban user');
      }

      // Refetch updated list
      await fetchCustomers();
    } catch (err) {
      console.error('Error banning user:', err);
      alert(err instanceof Error ? err : 'Failed to ban user');
    }
  }, [fetchCustomers]);

  // ================================
  // Unban user
  // ================================
  const unbanUser = useCallback(async (customerId: string) => {
    try {
      const response = await fetch('/api/admin/customers/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, action: 'unban' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unban user');
      }

      // Refetch updated list
      await fetchCustomers();
    } catch (err) {
      console.error('Error unbanning user:', err);
      alert(err instanceof Error ? err.message : 'Failed to unban user');
    }
  }, [fetchCustomers]);

  return {
    customers,
    total,
    loading,
    error,
    search,
    setSearch,
    limit,
    offset,
    setLimit,
    setOffset,
    refetch: fetchCustomers,
    banUser,
    unbanUser,
  };
}
