"use client";

import { Users, DollarSign, Package, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import PackageDistributionCard from "@/components/dashboard/PackageDistributionCard";
import RevenueTrendCard from "@/components/dashboard/RevenueTrenCard";
import Logs from "@/components/dashboard/Logs";

// Sample data
const packageData = [
  { name: "50", value: 30, color: "#3b82f6" },
  { name: "100", value: 25, color: "#10b981" },
  { name: "200", value: 45, color: "#f59e0b" },
];

const revenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 4500 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 5500 },
];

const recentPurchases = [
  { email: "john@example.com", amount: 200, timeAgo: "5 minutes ago" },
  { email: "sarah@example.com", amount: 100, timeAgo: "12 minutes ago" },
  { email: "mike@example.com", amount: 50, timeAgo: "23 minutes ago" },
  { email: "emily@example.com", amount: 200, timeAgo: "35 minutes ago" },
  { email: "david@example.com", amount: 100, timeAgo: "1 hour ago" },
];

export default function OpsPage() {
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Dashboard
          </h1>
          <p className="text-primary/50 text-sm sm:text-base">
            Welcome to your admin dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  
          gap-4 sm:gap-6 mb-8"
        >
          <StatCard
            title="Total Users"
            value="2,543"
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          />
          <StatCard
            title="Total Revenue"
            value="$45,231"
            icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
          />
          <StatCard
            title="Active Packages"
            value="1,234"
            icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
          />
          <StatCard
            title="Growth Rate"
            value="23.5%"
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          />
        </div>

        {/* Charts Section */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 
          place-items-center"
        >
          <RevenueTrendCard data={revenueData} />
          <PackageDistributionCard data={packageData} />
        </div>

        {/* Recent Purchases Section */}
        <div
          className="bg-dashboard-bg rounded-xl shadow-md p-4 sm:p-6 
          overflow-x-auto"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-primary/50 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-3 min-w-[280px]">
            {recentPurchases.map((purchase, index) => (
              <Logs
                key={index}
                email={purchase.email}
                amount={purchase.amount}
                timeAgo={purchase.timeAgo}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
