"use client";

import { DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";
import StatCard from "@/components/dashborad/StatCard";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import { useAdminSalesDashboard } from "@/hooks/admin/use-admin-sales-dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PackagePerformance {
  package: string;
  credits: number;
  unitsSold: number;
  totalRevenue: string;
  avgPerDay: number;
}

interface Transaction {
  transactionId: string;
  user: string;
  package: string;
  credits: string;
  amount: string;
  date: string;
}

export default function SalesTrackingPage() {
  const { dashboard, loading, error, refetch } = useAdminSalesDashboard();

  // Stats data from API
  const stats = [
    {
      title: "Total Sales",
      value: loading ? "..." : `$${((dashboard?.stats?.total_sales || 0) / 100).toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Active Package",
      value: loading ? "..." : dashboard?.stats?.active_packages?.toLocaleString() || "0",
      icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "This Month",
      value: loading ? "..." : `$${((dashboard?.stats?.this_month_sales || 0) / 100).toLocaleString()}`,
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Total Transactions",
      value: loading ? "..." : dashboard?.stats?.total_transactions?.toLocaleString() || "0",
      icon: <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  // Revenue chart data from API - format for chart
  const revenueData = dashboard?.revenue_by_package?.map((item) => ({
    month: new Date(item.month).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    }),
    'Starter': item.starter / 100,        // Convert cents to dollars
    'Transformation': item.transformation / 100,
    'Professional': item.professional / 100,
  })) || [];

  // Package performance from API
  const packagePerformance: PackagePerformance[] = dashboard?.package_performance?.map((pkg) => ({
    package: pkg.package_name,
    credits: pkg.credits,
    unitsSold: pkg.units_sold,
    totalRevenue: `$${(pkg.total_revenue / 100).toLocaleString()}`,
    avgPerDay: pkg.avg_per_day,
  })) || [];

  // Recent transactions from API
  const recentTransactions: Transaction[] = dashboard?.recent_transactions?.map((tx) => ({
    transactionId: tx.transaction_id.substring(0, 8), // Shorten UUID
    user: tx.user_email,
    package: tx.package_name,
    credits: `${(tx.credits / 1000).toFixed(1)}K`,
    amount: `$${(tx.amount / 100).toLocaleString()}`,
    date: new Date(tx.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  })) || [];

  // Package performance columns
  const performanceColumns: Column<PackagePerformance>[] = [
    {
      key: "package",
      header: "Package",
      className: "text-white text-xs sm:text-sm font-medium",
    },
    {
      key: "credits",
      header: "Credits",
      className: "text-xs sm:text-sm",
      render: (value) => value.toLocaleString(),
    },
    {
      key: "unitsSold",
      header: "Units Sold",
      className: "text-xs sm:text-sm",
      render: (value) => value.toLocaleString(),
    },
    {
      key: "totalRevenue",
      header: "Total Revenue",
      className: "text-xs sm:text-sm",
    },
    {
      key: "avgPerDay",
      header: "Avg/Day",
      className: "text-xs sm:text-sm",
      render: (value) => value.toFixed(1),
    },
  ];

  // Recent transactions columns
  const transactionColumns: Column<Transaction>[] = [
    {
      key: "transactionId",
      header: "Transaction ID",
      className: "text-primary/70 text-xs sm:text-sm font-mono",
    },
    {
      key: "user",
      header: "User",
      className: "text-xs sm:text-sm hidden md:table-cell",
    },
    {
      key: "package",
      header: "Package",
      className: "text-xs sm:text-sm",
    },
    {
      key: "credits",
      header: "Credits",
      className: "text-xs sm:text-sm hidden lg:table-cell",
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-green-500 text-xs sm:text-sm font-semibold",
    },
    {
      key: "date",
      header: "Date",
      className: "text-xs sm:text-sm",
    },
  ];

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-500 mb-4">Failed to load dashboard data</p>
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
              Sales Tracking
            </h1>
            <p className="text-sm sm:text-base text-primary/50">
              Monitor revenue, packages, and transactions
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-card hover:bg-card/70 text-white rounded-md transition-colors disabled:opacity-50"
          >
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

        {/* Revenue by Package Type Chart */}
        <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
            Revenue by Package Type
          </h2>
          {loading ? (
            <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
              <div className="text-primary/50">Loading chart data...</div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
              <div className="text-primary/50">No revenue data available</div>
            </div>
          ) : (
            <div className="h-64 sm:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#888" 
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E1E1E",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="Starter"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Transformation"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Professional"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Package Performance */}
        <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Package Performance
          </h2>
          <div className="rounded-xl overflow-x-auto">
            <DataTable
              columns={performanceColumns}
              data={packagePerformance}
              emptyMessage={loading ? "Loading package data..." : "No package data available"}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Recent Transactions
          </h2>
          <div className="rounded-xl overflow-x-auto">
            <DataTable
              columns={transactionColumns}
              data={recentTransactions}
              emptyMessage={loading ? "Loading transactions..." : "No transactions available"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}