"use client";

import { Users, DollarSign, Package, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashborad/StatCard";
import PackageDistributionCard from "@/components/dashborad/PackageDistributionCard";
import RevenueTrendCard from "@/components/dashborad/RevenueTrenCard";
import Logs from "@/components/dashborad/Logs";
import { useAdminDashboard } from "@/hooks/admin/use-admin-dashboard";

export default function OpsPage() {
  const { data, loading, error } = useAdminDashboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-primary/50">
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Failed to load dashboard data
      </div>
    );
  }

  // Extract API Response
  const { stats, packageDistribution, revenueTrend, recentLogs } = data;

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers ?? 0}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          />

          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue ?? 0}`}
            icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
          />

          <StatCard
            title="Active Packages"
            value={stats.activePackages ?? 0}
            icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
          />

          <StatCard
            title="Growth Rate"
            value={`${stats.growthRate ?? 0}%`}
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 place-items-center">
          <RevenueTrendCard data={revenueTrend} />
          <PackageDistributionCard data={packageDistribution} />
        </div>

        {/* Recent Transactions Logs */}
        <div className="bg-dashboard-bg rounded-xl shadow-md p-4 sm:p-6 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-primary/50 mb-4">
            Recent Activities
          </h2>

          <div className="space-y-3 min-w-[280px]">
            {recentLogs.map((log: any, index: number) => (
              <Logs
                key={index}
                email={log.email}
                amount={log.amount}
                timeAgo={log.timeAgo}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
