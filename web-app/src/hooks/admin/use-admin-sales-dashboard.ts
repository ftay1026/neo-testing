import { useState, useEffect, useCallback } from "react";

export interface SalesDashboardResponse {
  stats: {
    total_sales: number;
    active_packages: number;
    this_month_sales: number;
    total_transactions: number;
  };

  revenue_by_package: RevenueByPackage[];
  
  monthly_revenue: MonthlyRevenue[];
  
  package_performance: PackagePerformance[];
  
  recent_transactions: RecentTransaction[];
}

// =====================================================
// DETAILED INTERFACES
// =====================================================

export interface RevenueByPackage {
  month: string;           // '2024-11-01'
  starter: number;
  transformation: number;
  professional: number;
}

export interface MonthlyRevenue {
  month: string;           // '2024-11-01'
  revenue: number;
}

export interface PackagePerformance {
  package_id: string;      // 'starter', 'transformation', 'professional'
  package_name: string;    // 'Starter', 'Transformation', 'Professional'
  credits: number;
  units_sold: number;
  total_revenue: number;
  avg_per_day: number;
}

export interface RecentTransaction {
  transaction_id: string;  // UUID
  user_email: string;
  package_name: string;
  credits: number;
  amount: number;
  date: string;           // ISO timestamp
}

interface UseAdminSalesDashboardReturn {
  dashboard: SalesDashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminSalesDashboard(): UseAdminSalesDashboardReturn {
  const [dashboard, setDashboard] = useState<SalesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/sales-dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to fetch admin dashboard");
      }

      

      const { dashboard } = await res.json();
      setDashboard(dashboard);
    } 
    catch (err: any) {
      setError(err.message || "Unknown error");
    } 
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard
  };
}
