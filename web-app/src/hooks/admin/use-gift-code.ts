// =====================================================
// FILE: /hooks/admin/use-giftcode.ts
// All gift code related hooks for admin
// =====================================================

import { useState, useEffect, useCallback } from 'react';

// =====================================================
// TYPES
// =====================================================

export interface GiftCode {
  id: string;
  code: string;
  credits_amount: number;
  max_uses: number;
  current_uses: number;
  remaining_uses: number;
  expires_at: string;
  is_active: boolean;
  status: string;
  created_at: string;
  notes: string | null;
}

export interface CreateGiftCodeParams {
  code: string;
  creditsAmount: number;
  maxUses?: number;
  expiresAt?: string;
  notes?: string;
}

export interface EditGiftCodeParams {
  maxUses?: number;
  expiresAt?: string;
  notes?: string;
}

export interface RedeemGiftCodeParams {
  code: string;
}

interface UseGiftCodesReturn {
  codes: GiftCode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateGiftCodeReturn {
  createGiftCode: (params: CreateGiftCodeParams) => Promise<{
    success: boolean;
    message: string;
    codeId?: string;
  }>;
  loading: boolean;
  error: string | null;
}

interface UseEditGiftCodeReturn {
  editGiftCode: (id: string, params: EditGiftCodeParams) => Promise<{
    success: boolean;
    message: string;
  }>;
  loading: boolean;
  error: string | null;
}

interface UseDeactivateGiftCodeReturn {
  deactivateGiftCode: (id: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  loading: boolean;
  error: string | null;
}

interface UseRedeemGiftCodeReturn {
  redeemGiftCode: (params: RedeemGiftCodeParams) => Promise<{
    success: boolean;
    message: string;
    creditsReceived?: number;
    newBalance?: number;
  }>;
  loading: boolean;
  error: string | null;
}

// =====================================================
// HOOK 1: useGiftCodes
// Get all gift codes (admin only)
// =====================================================

export function useGiftCodes(): UseGiftCodesReturn {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/gift-codes');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch gift codes');
      }
      
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (err) {
      console.error('Error fetching gift codes:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  return { codes, loading, error, refetch: fetchCodes };
}

// =====================================================
// HOOK 2: useCreateGiftCode
// Create a new gift code (admin only)
// =====================================================

export function useCreateGiftCode(): UseCreateGiftCodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGiftCode = useCallback(async (params: CreateGiftCodeParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create gift code');
      }
      
      return {
        success: data.success,
        message: data.message,
        codeId: data.codeId,
      };
    } catch (err) {
      console.error('Error creating gift code:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createGiftCode, loading, error };
}

// =====================================================
// HOOK 3: useEditGiftCode
// Edit an existing gift code (admin only)
// =====================================================

export function useEditGiftCode(): UseEditGiftCodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editGiftCode = useCallback(async (id: string, params: EditGiftCodeParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/gift-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit gift code');
      }
      
      return {
        success: data.success,
        message: data.message,
      };
    } catch (err) {
      console.error('Error editing gift code:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { editGiftCode, loading, error };
}

// =====================================================
// HOOK 4: useDeactivateGiftCode
// Deactivate a gift code (admin only)
// =====================================================

export function useDeactivateGiftCode(): UseDeactivateGiftCodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivateGiftCode = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/gift-codes/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate gift code');
      }
      
      return {
        success: data.success,
        message: data.message,
      };
    } catch (err) {
      console.error('Error deactivating gift code:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { deactivateGiftCode, loading, error };
}

// =====================================================
// HOOK 5: useRedeemGiftCode
// Redeem a gift code (user)
// =====================================================

export function useRedeemGiftCode(): UseRedeemGiftCodeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeemGiftCode = useCallback(async (params: RedeemGiftCodeParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/gift-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem gift code');
      }
      
      return {
        success: data.success,
        message: data.message,
        creditsReceived: data.creditsReceived,
        newBalance: data.newBalance,
      };
    } catch (err) {
      console.error('Error redeeming gift code:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { redeemGiftCode, loading, error };
}

