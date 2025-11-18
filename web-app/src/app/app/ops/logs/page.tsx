"use client";

import { AlertCircle, AlertTriangle, Info, RefreshCw, Download } from "lucide-react";
import StatCard from "@/components/dashborad/StatCard";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import { useState, useMemo } from "react";
import { useSystemLogs } from "@/hooks/admin/use-system-logs";

interface FormattedLog {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  user: string;
  timestamp: string;
  category: string;
  metadata: any;
}

export default function SystemLogsPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "error" | "warning" | "info">("all");
  const [limit] = useState(50);
  const [offset] = useState(0);

  // Fetch logs with active filter
  const { logs, total, isLoading, error, refetch } = useSystemLogs({
    eventType: activeFilter === "all" ? undefined : activeFilter,
    limit,
    offset,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const errorCount = logs.filter(log => log.event_type === "error").length;
    const warningCount = logs.filter(log => log.event_type === "warning").length;
    const infoCount = logs.filter(log => log.event_type === "info").length;

    return [
      {
        title: "Total Errors",
        value: errorCount.toString(),
        icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        title: "Warnings",
        value: warningCount.toString(),
        icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        title: "Info Logs",
        value: infoCount.toString(),
        icon: <Info className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      {
        title: "Total Logs",
        value: total.toString(),
        icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
    ];
  }, [logs, total]);

  // Format logs for table
  const formattedLogs: FormattedLog[] = useMemo(() => {
    return logs.map(log => ({
      id: log.id,
      level: log.event_type as "error" | "warning" | "info",
      message: log.message,
      user: log.customer_id || log.user_id || "system",
      timestamp: new Date(log.created_at).toLocaleString(),
      category: log.category,
      metadata: log.metadata,
    }));
  }, [logs]);

  // Export logs function
  const handleExport = () => {
    const csv = [
      ["Level", "Message", "User", "Category", "Timestamp"],
      ...formattedLogs.map(log => [
        log.level,
        log.message,
        log.user,
        log.category,
        log.timestamp,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  // System logs columns
  const logColumns: Column<FormattedLog>[] = [
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
      key: "category",
      header: "Category",
      className: "text-white text-xs sm:text-sm capitalize",
    },
    {
      key: "message",
      header: "Message",
      className: "text-white text-xs sm:text-sm max-w-md truncate",
    },
    {
      key: "user",
      header: "User/Customer",
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
                Monitor errors, warnings, and system events
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refetch}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-primary/10 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading || logs.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 text-red-400 p-4 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

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
              Errors
            </button>
            <button
              onClick={() => setActiveFilter("warning")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === "warning"
                  ? "bg-orange-600 text-white"
                  : "bg-card text-primary/70 hover:bg-orange-600/10"
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setActiveFilter("info")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === "info"
                  ? "bg-gray-600 text-white"
                  : "bg-card text-primary/70 hover:bg-gray-600/10"
              }`}
            >
              Info
            </button>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                columns={logColumns}
                data={formattedLogs}
                emptyMessage="No logs available"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}