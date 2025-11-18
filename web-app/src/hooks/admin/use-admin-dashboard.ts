import { useEffect, useState, useCallback } from 'react';

interface DashboardResponse {
    stats: {
        totalUsers: number;
        totalRevenue: number;
        activePackages: number;
        growthRate: number;
    };

    revenueTrend: {
        name: string;
        revenue: number;
    }[];

    packageDistribution: {
        name: string;
        value: number;
        color: string;
    }[];

recentLogs: {
    email: string;
    pricing_tier: string;
    amount: number;
    timeAgo: string;
} [];
}
const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#8E44AD", "#2ECC71"];


export function useAdminDashboard() {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/admin/dashboard');
            if (!res.ok) throw new Error('Failed to fetch dashboard data');

            const json = await res.json();
            const d = json.dashboard; // raw SQL output

            // 🔥 Normalize SQL → React format
            const normalized: DashboardResponse = {
                stats: {
                    totalUsers: d.total_customers,
                    totalRevenue: d.total_revenue,
                    activePackages: d.active_packages,
                    growthRate: d.growth_rate,
                },

                revenueTrend: d.revenue_trend.map((item: any) => ({
                    name: item.month,
                    revenue: item.revenue,
                })),

                packageDistribution: d.package_distribution.map((item: any, index: number) => ({
                    name: item.pricing_tier_id,          // <-- required by chart
                    value: item.package_count,           // <-- chart expects "value"
                    color: COLORS[index % COLORS.length] // <-- assign a color
                })),


                recentLogs: d.recent_transactions.map((item: any) => ({
                    email: item.email,
                    pricing_tier: item.pricing_tier,
                    amount: item.amount,
                    timeAgo: timeAgo(item.created_at),
                })),
            };

            setData(normalized);
        } catch (err: any) {
            setError(err.message || 'Unexpected error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        refetch: fetchDashboard,
    };
}

/*** Helper: Convert timestamp → "5 min ago" ***/
function timeAgo(dateString: string): string {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}
