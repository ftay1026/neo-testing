"use client";

import { DollarSign, TrendingUp, PieChart, BarChart3, Loader2 } from "lucide-react";
import StatCard from "@/components/dashborad/StatCard";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import { useAdminFinancialAnalytics } from "@/hooks/admin/use-admin-financial-analytics";
import { useUpdateBillingSettings } from "@/hooks/admin/use-update-billing";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

interface UsageTransaction {
    customer_id: string;
    tokens_used: number;
    credits_used: number;
    api_cost: number;
    profit: number;
    model: string;
    created_at: string;
    last_updated_at: string;
}

export default function FinancialAnalyticsPage() {
    const { data, loading, error, refetch } = useAdminFinancialAnalytics();
    const { updateBillingSettings, isUpdating, error: updateError } = useUpdateBillingSettings();

    const [billingSettings, setBillingSettings] = useState({
        credit_value: 0.008,
        input_rate: 0.000003,
        output_rate: 0.000015,
        margin_multiplier: 1.5,
    });

    // Update local state when data loads
    useEffect(() => {
        if (data?.billingSettings) {
            setBillingSettings({
                credit_value: Number(data.billingSettings.credit_value),
                input_rate: Number(data.billingSettings.input_rate),
                output_rate: Number(data.billingSettings.output_rate),
                margin_multiplier: Number(data.billingSettings.margin_multiplier),
            });
        }
    }, [data?.billingSettings]);

    // Stats data from API
    const stats = [
        {
            title: "Total Revenue",
            value: loading ? "..." : `$${(data?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "API Costs",
            value: loading ? "..." : `$${(data?.totalApiCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "Net Profit",
            value: loading ? "..." : `$${(data?.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "Profit Margin",
            value: loading ? "..." : data?.totalRevenue 
                ? `${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}%`
                : "0%",
            icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
    ];

    // Revenue vs Cost vs Profit line chart data from API
    const revenueVsCostData = (data?.revenueCostProfit || []).map(item => ({
        month: item.month,
        Revenue: item.revenue,
        "API Cost": item.api_cost,
        Profit: item.profit,
    }));

    // Monthly profit breakdown bar chart data from API
    const monthlyProfitData = (data?.revenueCostProfit || []).map(item => ({
        month: item.month,
        profit: item.profit,
    }));

    // Usage transactions from API
    const usageTransactions: UsageTransaction[] = data?.usageTransactions || [];

    // Usage transactions columns
    const usageColumns: Column<UsageTransaction>[] = [
        {
            key: "customer_id",
            header: "Customer ID",
            className: "text-white text-xs sm:text-sm font-medium",
            render: (value) => (
                <span className="font-mono text-xs">{value.substring(0, 8)}...</span>
            ),
        },
        {
            key: "model",
            header: "Model",
            className: "text-xs sm:text-sm",
        },
        {
            key: "tokens_used",
            header: "Tokens Used",
            className: "text-xs sm:text-sm",
            render: (value) => value.toLocaleString(),
        },
        {
            key: "credits_used",
            header: "Credits Used",
            className: "text-xs sm:text-sm",
            render: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        },
        {
            key: "api_cost",
            header: "API Cost",
            className: "text-xs sm:text-sm hidden md:table-cell",
            render: (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
        },
        {
            key: "profit",
            header: "Profit",
            className: "text-green-500 text-xs sm:text-sm font-semibold",
            render: (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
        },
        {
            key: "last_updated_at",
            header: "last Updated",
            className: "text-xs sm:text-sm hidden lg:table-cell",
            render: (value) => new Date(value).toLocaleDateString(),
        },
    ];

    const handleSettingsUpdate = async () => {
        const result = await updateBillingSettings(billingSettings);
        
        if (result.success) {
            alert('Billing settings updated successfully');
            await refetch();
        } else {
            alert(`Failed to update settings: ${result.error}`);
        }
    };

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                        <p className="text-red-500 mb-4">Failed to load financial analytics</p>
                        <p className="text-sm text-primary/70 mb-4">{error}</p>
                        <button
                            onClick={refetch}
                            className="px-4 py-2 bg-card hover:bg-card/70 text-white rounded-md transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                            Financial Analytics
                        </h1>
                        <p className="text-sm sm:text-base text-primary/50">
                            Track revenue, costs, and profit margins
                        </p>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="px-4 py-2 bg-card hover:bg-card/70 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                        />
                    ))}
                </div>

                {/* Pricing Configuration */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                        Pricing Configuration
                    </h2>
                    
                    {updateError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-500 text-sm">{updateError}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-primary/70 mb-2 block">
                                    Credit Value (USD per credit)
                                </label>
                                <input
                                    type="number"
                                    value={billingSettings.credit_value}
                                    onChange={(e) => setBillingSettings(prev => ({ 
                                        ...prev, 
                                        credit_value: parseFloat(e.target.value) || 0 
                                    }))}
                                    className="w-full px-3 py-2 bg-card text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                                    step="0.0001"
                                    min="0"
                                    disabled={loading || isUpdating}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-primary/70 mb-2 block">
                                    Input Token Rate (USD per token)
                                </label>
                                <input
                                    type="number"
                                    value={billingSettings.input_rate}
                                    onChange={(e) => setBillingSettings(prev => ({ 
                                        ...prev, 
                                        input_rate: parseFloat(e.target.value) || 0 
                                    }))}
                                    className="w-full px-3 py-2 bg-card text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                                    step="0.000001"
                                    min="0"
                                    disabled={loading || isUpdating}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-primary/70 mb-2 block">
                                    Output Token Rate (USD per token)
                                </label>
                                <input
                                    type="number"
                                    value={billingSettings.output_rate}
                                    onChange={(e) => setBillingSettings(prev => ({ 
                                        ...prev, 
                                        output_rate: parseFloat(e.target.value) || 0 
                                    }))}
                                    className="w-full px-3 py-2 bg-card text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                                    step="0.000001"
                                    min="0"
                                    disabled={loading || isUpdating}
                                />
                            </div>

                            <div>
                                <label className="text-sm text-primary/70 mb-2 block">
                                    Margin Multiplier
                                </label>
                                <input
                                    type="number"
                                    value={billingSettings.margin_multiplier}
                                    onChange={(e) => setBillingSettings(prev => ({ 
                                        ...prev, 
                                        margin_multiplier: parseFloat(e.target.value) || 0 
                                    }))}
                                    className="w-full px-3 py-2 bg-card text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
                                    step="0.1"
                                    min="0"
                                    disabled={loading || isUpdating}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSettingsUpdate}
                            disabled={isUpdating || loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isUpdating ? "Updating..." : "Update Settings"}
                        </button>
                    </div>

                    <div className="bg-card p-4 rounded-lg border border-primary/10 mt-4">
                        <p className="text-sm text-primary/70 mb-2">Current Configuration:</p>
                        <div className="space-y-1 text-xs sm:text-sm font-mono">
                            <p className="text-white">
                                Credit Value: ${billingSettings.credit_value.toFixed(6)} per credit
                            </p>
                            <p className="text-white">
                                Input Rate: ${billingSettings.input_rate.toFixed(8)} per token
                            </p>
                            <p className="text-white">
                                Output Rate: ${billingSettings.output_rate.toFixed(8)} per token
                            </p>
                            <p className="text-white">
                                Margin: {billingSettings.margin_multiplier}x
                            </p>
                        </div>
                    </div>
                </div>

                {/* Revenue vs Cost vs Profit Chart */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                        Revenue vs Cost vs Profit
                    </h2>
                    {loading ? (
                        <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                        </div>
                    ) : revenueVsCostData.length === 0 ? (
                        <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                            <div className="text-primary/50">No revenue data available</div>
                        </div>
                    ) : (
                        <div className="h-64 sm:h-80 lg:h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueVsCostData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888"
                                        tick={{ fill: "#888", fontSize: 12 }}
                                    />
                                    <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1E1E1E",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                        }}
                                        labelStyle={{ color: "#fff" }}
                                        formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "20px" }}
                                        iconType="circle"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="API Cost"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Profit"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* User Usage Transactions */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                        User Usage Transactions
                    </h2>
                    <div className="rounded-xl overflow-x-auto">
                        <DataTable
                            columns={usageColumns}
                            data={usageTransactions}
                            emptyMessage={loading ? "Loading usage data..." : "No usage data available"}
                        />
                    </div>
                </div>

                {/* Monthly Profit Breakdown */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                        Monthly Profit Breakdown
                    </h2>
                    {loading ? (
                        <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                        </div>
                    ) : monthlyProfitData.length === 0 ? (
                        <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
                            <div className="text-primary/50">No profit data available</div>
                        </div>
                    ) : (
                        <div className="h-64 sm:h-80 lg:h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyProfitData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888"
                                        tick={{ fill: "#888", fontSize: 12 }}
                                    />
                                    <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1E1E1E",
                                            border: "1px solid #333",
                                            borderRadius: "8px",
                                        }}
                                        labelStyle={{ color: "#fff" }}
                                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                                    />
                                    <Bar
                                        dataKey="profit"
                                        fill="#3b82f6"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}