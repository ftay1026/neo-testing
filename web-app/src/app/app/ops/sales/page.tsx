"use client";

import { DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
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
  // Stats data
  const stats = [
    {
      title: "Total Sales",
      value: "$984,240",
      icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Active Package",
      value: "3,625",
      icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "This Month",
      value: "$38,600",
      icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Transactions",
      value: "1,247",
      icon: <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  // Revenue chart data
  const revenueData = [
    { month: "Jan", "$20 Package": 15000, "$200 Package": 18000, "$500 Package": 12000 },
    { month: "Feb", "$20 Package": 18000, "$200 Package": 16000, "$500 Package": 14000 },
    { month: "Mar", "$20 Package": 16000, "$200 Package": 19000, "$500 Package": 13000 },
    { month: "Apr", "$20 Package": 19000, "$200 Package": 17000, "$500 Package": 15000 },
    { month: "May", "$20 Package": 20000, "$200 Package": 22000, "$500 Package": 16000 },
    { month: "Jun", "$20 Package": 22000, "$200 Package": 20000, "$500 Package": 18000 },
    { month: "Jul", "$20 Package": 21000, "$200 Package": 24000, "$500 Package": 19000 },
    { month: "Aug", "$20 Package": 25000, "$200 Package": 23000, "$500 Package": 20000 },
  ];

  // Package performance data
  const packagePerformance: PackagePerformance[] = [
    {
      package: "$20 Package",
      credits: 2000,
      unitsSold: 245,
      totalRevenue: "$4,900",
      avgPerDay: 8.2,
    },
    {
      package: "$200 Package",
      credits: 22500,
      unitsSold: 89,
      totalRevenue: "$17,800",
      avgPerDay: 2.9,
    },
    {
      package: "$500 Package",
      credits: 62500,
      unitsSold: 34,
      totalRevenue: "$17,000",
      avgPerDay: 1.1,
    },
  ];

  // Recent transactions data
  const recentTransactions: Transaction[] = [
    {
      transactionId: "#12453",
      user: "john@example.com",
      package: "$200 Package",
      credits: "22.5K",
      amount: "$200",
      date: "2025-10-17",
    },
    {
      transactionId: "#12452",
      user: "sarah@example.com",
      package: "$20 Package",
      credits: "2K",
      amount: "$20",
      date: "2025-10-17",
    },
    {
      transactionId: "#12451",
      user: "emma@example.com",
      package: "$500 Package",
      credits: "62.5K",
      amount: "$500",
      date: "2025-10-16",
    },
    {
      transactionId: "#12450",
      user: "mike@example.com",
      package: "$200 Package",
      credits: "22.5K",
      amount: "$200",
      date: "2025-10-16",
    },
    {
      transactionId: "#12449",
      user: "david@example.com",
      package: "$20 Package",
      credits: "2K",
      amount: "$20",
      date: "2025-10-16",
    },
  ];

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

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Sales Tracking
          </h1>
          <p className="text-sm sm:text-base text-primary/50">
            Monitor revenue, packages, and transactions
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

        {/* Revenue by Package Type Chart */}
        <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">
            Revenue by Package Type
          </h2>
          <div className="h-64 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
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
                <Bar dataKey="$20 Package" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="$200 Package" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="$500 Package" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
              emptyMessage="No package data available"
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
              emptyMessage="No transactions available"
            />
          </div>
        </div>
      </div>
    </div>
  );
}