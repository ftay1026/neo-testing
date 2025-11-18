"use client";

import { useState, useCallback } from "react";

export function useBulkGiftCredits() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bulkGift = useCallback(async (amount: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch(`/api/admin/credits/bulk-gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to process bulk gift");
      }

      setSuccess(true);
      return true;
    } catch (err: any) {
      console.error("Bulk gift error:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bulkGift,
    loading,
    error,
    success,
  };
}
