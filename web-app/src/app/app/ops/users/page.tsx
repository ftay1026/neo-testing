"use client";

import { Gift, Ban, UserX, Search } from "lucide-react";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import { useState } from "react";

interface User {
    name: string;
    email: string;
    status: "active" | "banned";
    credits: number;
    joinDate: string;
}

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Sample user data
    const usersData: User[] = [
        {
            name: "John Smith",
            email: "john@example.com",
            status: "active",
            credits: 15000,
            joinDate: "2024-01-15",
        },
        {
            name: "Sarah Johnson",
            email: "sarah@example.com",
            status: "active",
            credits: 8500,
            joinDate: "2024-02-20",
        },
        {
            name: "Mike Wilson",
            email: "mike@example.com",
            status: "banned",
            credits: 0,
            joinDate: "2024-03-10",
        },
        {
            name: "Emma Davis",
            email: "emma@example.com",
            status: "active",
            credits: 22500,
            joinDate: "2024-01-05",
        },
        {
            name: "David Brown",
            email: "david@example.com",
            status: "active",
            credits: 3200,
            joinDate: "2024-04-12",
        },
        {
            name: "Lisa Anderson",
            email: "lisa@example.com",
            status: "active",
            credits: 12000,
            joinDate: "2024-02-28",
        },
        {
            name: "Tom Martinez",
            email: "tom@example.com",
            status: "active",
            credits: 5600,
            joinDate: "2024-03-15",
        },
        {
            name: "Anna Taylor",
            email: "anna@example.com",
            status: "banned",
            credits: 0,
            joinDate: "2024-01-22",
        },
    ];

    // Filter users based on search query
    const filteredUsers = usersData.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Define table columns
    const columns: Column<User>[] = [
        {
            key: "name",
            header: "Name",
            className: "text-primary/70",
        },
        {
            key: "email",
            header: "Email",
            className: "text-primary/70",
        },
        {
            key: "status",
            header: "Status",
            render: (value) => (
                <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${value === "active"
                        ? "bg-card text-white"
                        : "bg-secondary-status text-white"
                        }`}
                >
                    {value}
                </span>
            ),
        },
        {
            key: "credits",
            header: "Credits",
            render: (value) => value.toLocaleString(),
        },
        {
            key: "joinDate",
            header: "Join Date",
        },
        {
            key: "actions",
            header: "Actions",
            render: (_, row) => (
                <div className="flex gap-2">
                    {row.status === "active" ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors">
                            <Ban className="w-4 h-4" />
                            Ban
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/50 text-white rounded-md text-sm transition-colors">
                            <UserX className="w-4 h-4" />
                            Unban
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors">
                        <Gift className="w-4 h-4" />
                        Gift
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        User Management
                    </h1>
                    <p className="text-primary/50">
                        Manage users, credits, and account status
                    </p>
                </div>

                {/* Search and Actions Section */}
                <div className="mb-6 flex flex-col h-36 bg-dashboard-bg  justify-between items-start p-6 rounded-xl space-y-6 ">
                    {/* Search Input */}

                    <label className="block text-lg text-primary/50 mb-2">
                        Search Users
                    </label>
                    <div className="relative w-full">
                        {/* Search Icon */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 w-5 h-5 pointer-events-none" />

                        {/* Input Field */}
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-4 py-2 bg-card text-primary/70 rounded-md focus:outline-none focus:border-blue-500 placeholder-primary/70"
                        />
                    </div>
                </div>



                <div className=" p-8 bg-dashboard-bg rounded-xl">
                    <div className="flex flex-row justify-between mb-10">
                        {/* User Count */}
                        <div className="mb-4">
                            <p className="text-lg text-primary/50">
                                User List ({filteredUsers.length})
                            </p>
                        </div>

                        {/* Bulk Actions Button */}
                        <button className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors">
                            <Gift className="w-5 h-5" />
                            Bulk Gift Credits
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-background-bg rounded-xl shadow-lg overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={filteredUsers}
                            emptyMessage="No users found"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}