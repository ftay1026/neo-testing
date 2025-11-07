"use client";

import { AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, Download } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import { useState } from "react";

interface SystemLog {
  level: "error" | "warning" | "info";
  message: string;
  user: string;
  timestamp: string;
}

export default function SystemLogsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "error" | "warning">("all");

  // Stats data
  const stats = [
    {
      title: "Total Errors",
      value: "23",
      icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Warnings",
      value: "47",
      icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Open Issues",
      value: "8",
      icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      title: "Resolved Today",
      value: "12",
      icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  // System logs data
  const systemLogs: SystemLog[] = [
    {
      level: "error",
      message: "API timeout: Anthropic Claude request failed",
      user: "john@example.com",
      timestamp: "2025-10-17 14:32:15",
    },
    {
      level: "error",
      message: "Payment processing failed: Card declined",
      user: "sarah@example.com",
      timestamp: "2025-10-17 13:45:22",
    },
    {
      level: "warning",
      message: "High API usage detected for user",
      user: "mike@example.com",
      timestamp: "2025-10-17 12:18:40",
    },
    {
      level: "error",
      message: "Database connection timeout",
      user: "system",
      timestamp: "2025-10-17 11:05:33",
    },
    {
      level: "warning",
      message: "Credit expiration email failed to send",
      user: "system",
      timestamp: "2025-10-17 10:22:11",
    },
    {
      level: "info",
      message: "Bulk credit gift operation completed",
      user: "admin",
      timestamp: "2025-10-17 09:15:44",
    },
  ];

  // Filter logs based on active filter
  const filteredLogs = activeFilter === "all" 
    ? systemLogs 
    : systemLogs.filter(log => log.level === activeFilter);

  // System logs columns
  const logColumns: Column<SystemLog>[] = [
    {
      key: "level",
      header: "Level",
      render: (value) => {
        const styles = {
          error: "bg-red-600 text-white",
          warning: "bg-orange-600 text-white",
          info: "bg-gray-700 text-white",
        };
        const labels = {
          error: "Error",
          warning: "Warning",
          info: "Info",
        };
        return (
          <span
            className={`px-3 py-1 rounded-lg text-xs font-medium ${styles[value]}`}
          >
            {labels[value]}
          </span>
        );
      },
    },
    {
      key: "message",
      header: "Message",
      className: "text-white text-xs sm:text-sm",
    },
    {
      key: "user",
      header: "User",
      className: "text-xs sm:text-sm hidden md:table-cell",
    },
    {
      key: "timestamp",
      header: "Timestamp",
      className: "text-xs sm:text-sm text-primary/70",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                System Logs
              </h1>
              <p className="text-sm sm:text-base text-primary/50">
                Monitor errors, warnings, and user-reported issues
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-primary/10 text-white rounded-md text-sm font-medium transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Logs</span>
              </button>
            </div>
          </div>
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

        {/* Filter Tabs */}
        <div className="bg-dashboard-bg p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-primary text-white"
                  : "bg-card text-primary/70 hover:bg-primary/10"
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setActiveFilter("error")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === "error"
                  ? "bg-red-600 text-white"
                  : "bg-card text-primary/70 hover:bg-red-600/10"
              }`}
            >
              Error Logs
            </button>
            <button
              onClick={() => setActiveFilter("warning")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === "warning"
                  ? "bg-orange-600 text-white"
                  : "bg-card text-primary/70 hover:bg-orange-600/10"
              }`}
            >
              User Reports
            </button>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl overflow-x-auto">
            <DataTable
              columns={logColumns}
              data={filteredLogs}
              emptyMessage="No logs available"
            />
          </div>
        </div>
      </div>
    </div>
  );
}