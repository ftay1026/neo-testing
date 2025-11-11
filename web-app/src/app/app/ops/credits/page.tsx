"use client";

import { Gift, Clock, Ticket, Plus, AlertCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface CreditUser {
    user: string;
    email: string;
    credits: number;
    expiresOn: string;
    daysLeft: number;
}

interface GiftCode {
    code: string;
    credits: number;
    uses: string;
    status: "active" | "expired";
    expiry: string;
}

export default function CreditManagementPage() {
    // Stats data
    const stats = [
        { title: "Total Credits Issued", value: "1.2M", icon: <Gift className="w-5 h-5" /> },
        { title: "Credits Expiring Soon", value: "28.7K", icon: <Clock className="w-5 h-5" /> },
        { title: "Active Gift Codes", value: "2", icon: <Ticket className="w-5 h-5" /> },
    ];

    // Credits expiring soon data
    const expiringCredits: CreditUser[] = [
        {
            user: "John Smith",
            email: "john@example.com",
            credits: 5000,
            expiresOn: "2025-01-20",
            daysLeft: 95,
        },
        {
            user: "Sarah Johnson",
            email: "sarah@example.com",
            credits: 8500,
            expiresOn: "2025-02-15",
            daysLeft: 121,
        },
        {
            user: "Emma Davis",
            email: "emma@example.com",
            credits: 12000,
            expiresOn: "2025-03-10",
            daysLeft: 144,
        },
        {
            user: "Lisa Anderson",
            email: "lisa@example.com",
            credits: 3200,
            expiresOn: "2024-12-30",
            daysLeft: 74,
        },
    ];

    // Gift codes data
    const giftCodes: GiftCode[] = [
        {
            code: "WELCOME2025",
            credits: 1000,
            uses: "45 / 100",
            status: "active",
            expiry: "2025-12-31",
        },
        {
            code: "BETA50",
            credits: 5000,
            uses: "23 / 50",
            status: "active",
            expiry: "2025-06-30",
        },
        {
            code: "LAUNCH500",
            credits: 500,
            uses: "150 / 150",
            status: "expired",
            expiry: "2024-10-15",
        },
    ];

    // Credits expiring soon columns
    const creditColumns: Column<CreditUser>[] = [
        {
            key: "user",
            header: "User",
            className: "text-white",
        },
        {
            key: "email",
            header: "Email",
            className: "text-white",
        },
        {
            key: "credits",
            header: "Credits",
            render: (value) => value.toLocaleString(),
        },
        {
            key: "expiresOn",
            header: "Expires On",
        },
        {
            key: "daysLeft",
            header: "Days Left",
            render: (value) => (
                <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${value < 90
                        ? "bg-secondary-status text-white"
                        : "bg-white text-card"
                        }`}
                >
                    {value} days
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: () => (
                <button className="px-6 py-3 bg-white hover:bg-primary/50 text-card rounded-md text-sm font-bold transition-colors flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Extend
                </button>
            ),
        },
    ];

    // Gift codes columns
    const giftCodeColumns: Column<GiftCode>[] = [
        {
            key: "code",
            header: "Code",
            className: "text-primary/70",
        },
        {
            key: "credits",
            header: "Credits",
            render: (value) => value.toLocaleString(),
        },
        {
            key: "uses",
            header: "Uses",
        },
        {
            key: "status",
            header: "Status",
            render: (value) => (
                <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${value === "active"
                        ? "bg-card text-white"
                        : "bg-white text-card"
                        }`}
                >
                    {value}
                </span>
            ),
        },
        {
            key: "expiry",
            header: "Expiry",
        },
        {
            key: "actions",
            header: "Actions",
            render: () => (
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white hover:bg-primary/70 text-card rounded-md text-sm transition-colors">
                        Edit
                    </button>
                    <button className="px-4 py-2 bg-secondary-status hover:bg-secondary-status/50 text-white rounded-md text-sm transition-colors">
                        Deactivate
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Credit Management
                    </h1>
                    <p className="text-primary/50">
                        Track credit balances, expirations, and gift codes
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                        />
                    ))}
                </div>

                {/* Credits Expiring Soon Section */}
                
                    <div className="bg-dashboard-bg p-6 rounded-xl mb-8">
                        <div className="">
                            <div className=" flex flex-col justify-between  space-y-8 shadow-lg overflow-hidden">
                                <div className=" flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                    <h2 className="text-lg font-semibold text-orange-500">
                                        Credits Expiring Soon
                                    </h2>
                                </div>
                                <div className="bg-card border border-orange-900/30 rounded-xl  ">
                                <DataTable
                                    columns={creditColumns}
                                    data={expiringCredits}
                                    emptyMessage="No credits expiring soon"
                                />
                                </div>
                            </div>
                        </div>
                    </div>
                

                {/* Gift Codes Section */}
                <div className="bg-dashboard-bg p-8 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Gift Codes</h2>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                            <Plus className="w-5 h-5" />
                            Create Gift Code
                        </button>
                    </div>
                    <div className="rounded-xl shadow-lg overflow-hidden">
                        <DataTable
                            columns={giftCodeColumns}
                            data={giftCodes}
                            emptyMessage="No gift codes available"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}