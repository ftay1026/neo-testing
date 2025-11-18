import { useEffect, useState, useCallback } from 'react';

interface FinancialAnalyticsResponse {
    billingSettings: any;

    totalRevenue: number;
    totalApiCost: number;
    totalProfit: number;

    revenueCostProfit: {
        month: string;
        revenue: number;
        api_cost: number;
        profit: number;
    }[];

    usageTransactions: {
        customer_id: string;
        tokens_used: number;
        credits_used: number;
        api_cost: number;
        profit: number;
        model: string;
        created_at: string;
        last_updated_at: string;
    }[];
}

export function useAdminFinancialAnalytics() {
    const [data, setData] = useState<FinancialAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/admin/financial-analytics');
            if (!res.ok) throw new Error('Failed to fetch financial analytics');

            const json = await res.json();
            const d = json.analytics; // raw SQL output

            const normalized: FinancialAnalyticsResponse = {
                billingSettings: d.billing_settings,

                totalRevenue: d.total_revenue,
                totalApiCost: d.total_api_cost,
                totalProfit: d.total_profit,

                revenueCostProfit: d.revenue_cost_profit.map((item: any) => ({
                    month: item.month,
                    revenue: Number(item.revenue),
                    api_cost: Number(item.api_cost),
                    profit: Number(item.profit),
                })),

                usageTransactions: d.usage_transactions.map((u: any) => ({
                    customer_id: u.customer_id,
                    tokens_used: u.tokens_used,
                    credits_used: u.credits_used,
                    api_cost: Number(u.api_cost),
                    profit: Number(u.profit),
                    model: u.model,
                    created_at: u.created_at,
                    last_updated_at: u.last_updated_at,
                }))
            };

            setData(normalized);
        } catch (err: any) {
            setError(err.message || 'Unexpected error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        data,
        loading,
        error,
        refetch: fetchAnalytics,
    };
}
