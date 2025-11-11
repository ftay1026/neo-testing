"use client";

import { DollarSign, TrendingUp, PieChart, BarChart3, Calculator } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
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
import { useState } from "react";

interface ProfitAnalysis {
    package: string;
    unitsSold: number;
    revenue: string;
    apiCost: string;
    profit: string;
    margin: string;
}

export default function FinancialAnalyticsPage() {
    const [apiCostMultiplier, setApiCostMultiplier] = useState(14);
    const [customMultiplier, setCustomMultiplier] = useState("");

    // Stats data
    const stats = [
        {
            title: "Total Revenue",
            value: "$374,315",
            icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "API Costs",
            value: "$93,578",
            icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "Net Profit",
            value: "$280,737",
            icon: <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
        {
            title: "Profit Margin",
            value: "75.0%",
            icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />,
        },
    ];

    // Revenue vs Cost vs Profit line chart data
    const revenueVsCostData = [
        { month: "Jan", Revenue: 32000, "API Cost": 8000, Profit: 24000 },
        { month: "Feb", Revenue: 35000, "API Cost": 8750, Profit: 26250 },
        { month: "Mar", Revenue: 38000, "API Cost": 9500, Profit: 28500 },
        { month: "Apr", Revenue: 40000, "API Cost": 10000, Profit: 30000 },
        { month: "May", Revenue: 42000, "API Cost": 10500, Profit: 31500 },
        { month: "Jun", Revenue: 45000, "API Cost": 11250, Profit: 33750 },
        { month: "Jul", Revenue: 48000, "API Cost": 12000, Profit: 36000 },
        { month: "Aug", Revenue: 50000, "API Cost": 12500, Profit: 37500 },
    ];

    // Monthly profit breakdown bar chart data
    const monthlyProfitData = [
        { month: "Jan", profit: 24000 },
        { month: "Feb", profit: 26250 },
        { month: "Mar", profit: 28500 },
        { month: "Apr", profit: 30000 },
        { month: "May", profit: 31500 },
        { month: "Jun", profit: 33750 },
        { month: "Jul", profit: 36000 },
        { month: "Aug", profit: 37500 },
    ];

    // Profit analysis by package
    const profitAnalysis: ProfitAnalysis[] = [
        {
            package: "$20 Package",
            unitsSold: 245,
            revenue: "$4,900",
            apiCost: "$1,633",
            profit: "$3,267",
            margin: "66.7%",
        },
        {
            package: "$200 Package",
            unitsSold: 89,
            revenue: "$17,800",
            apiCost: "$5,933",
            profit: "$11,867",
            margin: "66.7%",
        },
        {
            package: "$500 Package",
            unitsSold: 34,
            revenue: "$17,000",
            apiCost: "$5,667",
            profit: "$11,333",
            margin: "66.7%",
        },
        {
            package: "Total",
            unitsSold: 368,
            revenue: "$39,700",
            apiCost: "$13,233",
            profit: "$26,467",
            margin: "66.7%",
        },
    ];

    // Profit analysis columns
    const profitColumns: Column<ProfitAnalysis>[] = [
        {
            key: "package",
            header: "Package",
            className: "text-white text-xs sm:text-sm font-medium",
        },
        {
            key: "unitsSold",
            header: "Units Sold",
            className: "text-xs sm:text-sm",
            render: (value) => value.toLocaleString(),
        },
        {
            key: "revenue",
            header: "Revenue",
            className: "text-xs sm:text-sm",
        },
        {
            key: "apiCost",
            header: "API Cost",
            className: "text-xs sm:text-sm hidden md:table-cell",
        },
        {
            key: "profit",
            header: "Profit",
            className: "text-green-500 text-xs sm:text-sm font-semibold",
        },
        {
            key: "margin",
            header: "Margin",
            className: "text-xs sm:text-sm",
        },
    ];

    const handleMultiplierUpdate = () => {
        const newValue = parseInt(customMultiplier);
        if (!isNaN(newValue) && newValue > 0) {
            setApiCostMultiplier(newValue);
            setCustomMultiplier("");
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                        Financial Analytics
                    </h1>
                    <p className="text-sm sm:text-base text-primary/50">
                        Track revenue, costs, and profit margins
                    </p>
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
                <div className="bg-dashboard-bg  p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <div className=" w-1/2">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                            Pricing Configuration
                        </h2>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm text-primary/70 mb-2 block">
                                        API Cost Multiplier:{" "}
                                        <span className="text-white font-semibold">{apiCostMultiplier}x</span>
                                    </label>

                                    <input
                                        type="number"
                                        value={apiCostMultiplier}
                                        onChange={(e) => setApiCostMultiplier(Number(e.target.value))}
                                        className="w-full md:w-40 px-3 py-2 bg-card text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-card"
                                        placeholder="Enter multiplier"
                                        step="0.1"
                                        min="0"
                                    />
                                    <p className="text-xs text-primary/50">
                                        Current multiplier: {apiCostMultiplier}x - This determines the markup over your API costs
                                    </p>
                                </div>
                                <button
                                    onClick={handleMultiplierUpdate}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    Update
                                </button>
                            </div>

                            <div className="bg-card p-4 rounded-lg border border-primary/10">
                                <p className="text-sm text-primary/70 mb-2">Revenue Calculation:</p>
                                <div className="space-y-1 text-xs sm:text-sm font-mono">
                                    <p className="text-white">
                                        API Cost: $50 × 14 = $700 (20 Package)
                                    </p>
                                    <p className="text-white">
                                        Profit: $200 (20) × 0.7 = $140/package
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue vs Cost vs Profit Chart */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                        Revenue vs Cost vs Profit
                    </h2>
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
                </div>

                {/* Profit Analysis by Package */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                        Profit Analysis by Package
                    </h2>
                    <div className="rounded-xl overflow-x-auto">
                        <DataTable
                            columns={profitColumns}
                            data={profitAnalysis}
                            emptyMessage="No profit data available"
                            rowClassName={(row, index) =>
                                row.package === "Total"
                                    ? "bg-primary/10 font-bold border-t-2 border-primary/20"
                                    : ""
                            }
                        />
                    </div>
                </div>

                {/* Monthly Profit Breakdown */}
                <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
                        Monthly Profit Breakdown
                    </h2>
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
                                    formatter={(value) => `$${value.toLocaleString()}`}
                                />
                                <Bar
                                    dataKey="profit"
                                    fill="#3b82f6"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}