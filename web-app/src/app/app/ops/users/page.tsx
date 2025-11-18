"use client";

import { Gift, Ban, UserX, Search } from "lucide-react";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import { useCustomers } from "@/hooks/admin/use-customers";
import { useEffect, useState } from "react";
import { useAddCredits } from "@/hooks/admin/use-credits";
import { useBulkGiftCredits } from "@/hooks/admin/use-bulk-gift";
import GiftCreditsModal from "@/components/dashborad/GiftCreditsModal";

export default function UsersPage() {
    const {
        customers,
        total,
        search,
        setSearch,
        limit,
        offset,
        setLimit,
        setOffset,
        loading,
        banUser,
        unbanUser,
    } = useCustomers();
    const { addCredits, loading: gifting } = useAddCredits();
    const { bulkGift, loading: bulkGifting } = useBulkGiftCredits();

    const [searchQuery, setSearchQuery] = useState(search);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [bulkGiftModalOpen, setBulkGiftModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchQuery);
            setOffset(0);
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery, setSearch, setOffset]);

    // Handle single user gift credits
    const handleGiftCredits = async (amount: number, description: string) => {
        if (!selectedUser) return;

        const success = await addCredits(selectedUser.id, amount, description);
        if (success) {
            alert(`Successfully gifted ${amount} credits to ${selectedUser.name}`);
            setGiftModalOpen(false);
            setSelectedUser(null);
        } else {
            alert("Failed to gift credits. Please try again.");
        }
    };

    // Handle bulk gift credits using the bulk API
    const handleBulkGiftCredits = async (amount: number, description: string) => {
        const success = await bulkGift(amount);
        
        if (success) {
            alert(`Successfully gifted ${amount} credits to all users`);
            setBulkGiftModalOpen(false);
        } else {
            alert("Failed to bulk gift credits. Please try again.");
        }
    };

    // Handle ban user with loading state
    const handleBanUser = async (userId: string) => {
        setActionLoading((prev) => ({ ...prev, [`ban-${userId}`]: true }));
        try {
            await banUser(userId);
        } finally {
            setActionLoading((prev) => ({ ...prev, [`ban-${userId}`]: false }));
        }
    };

    // Handle unban user with loading state
    const handleUnbanUser = async (userId: string) => {
        setActionLoading((prev) => ({ ...prev, [`unban-${userId}`]: true }));
        try {
            await unbanUser(userId);
        } finally {
            setActionLoading((prev) => ({ ...prev, [`unban-${userId}`]: false }));
        }
    };

    // Map API data to UI structure
    const usersData = customers.map((u) => ({
        id: u.customer_id,
        name: u.name,
        email: u.email,
        status: u.is_banned ? "banned" : "active",
        credits: u.credits ?? 0,
        joinDate: new Date(u.created_at).toLocaleDateString(),
    }));

    const columns: Column<any>[] = [
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
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        value === "active"
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
            render: (_, row) => {
                const isBanLoading = actionLoading[`ban-${row.id}`];
                const isUnbanLoading = actionLoading[`unban-${row.id}`];

                return (
                    <div className="flex gap-2">
                        {row.status === "active" ? (
                            <button
                                onClick={() => handleBanUser(row.id)}
                                disabled={isBanLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors disabled:opacity-50 min-w-[100px] justify-center"
                            >
                                {isBanLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Banning...
                                    </>
                                ) : (
                                    <>
                                        <Ban className="w-4 h-4" />
                                        Ban
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleUnbanUser(row.id)}
                                disabled={isUnbanLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card/50 text-white rounded-md text-sm transition-colors disabled:opacity-50 min-w-[100px] justify-center"
                            >
                                {isUnbanLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Unbanning...
                                    </>
                                ) : (
                                    <>
                                        <UserX className="w-4 h-4" />
                                        Unban
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSelectedUser({ id: row.id, name: row.name });
                                setGiftModalOpen(true);
                            }}
                            disabled={gifting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors disabled:opacity-50"
                        >
                            <Gift className="w-4 h-4" />
                            Gift
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-primary/50">
                        Manage users, credits, and account status
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex flex-col h-36 bg-dashboard-bg justify-between items-start p-6 rounded-xl space-y-6">
                    <label className="block text-lg text-primary/50 mb-2">Search Users</label>

                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 w-5 h-5 pointer-events-none" />

                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-4 py-2 bg-card text-primary/70 rounded-md focus:outline-none placeholder-primary/70"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="p-8 bg-dashboard-bg rounded-xl">
                    <div className="flex flex-row justify-between mb-10">
                        <p className="text-lg text-primary/50">User List ({total})</p>

                        <button 
                            onClick={() => setBulkGiftModalOpen(true)}
                            disabled={loading || bulkGifting}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                        >
                            <Gift className="w-5 h-5" />
                            Bulk Gift Credits
                        </button>
                    </div>

                    <div className="bg-background-bg rounded-xl shadow-lg overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={usersData}
                            emptyMessage={loading ? "Loading..." : "No users found"}
                        />
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            disabled={offset === 0 || loading}
                            onClick={() => setOffset(offset - limit)}
                            className="px-4 py-2 bg-card text-white rounded disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-primary/50">
                            Showing {offset + 1} – {Math.min(offset + limit, total)} of {total}
                        </span>

                        <button
                            disabled={offset + limit >= total || loading}
                            onClick={() => setOffset(offset + limit)}
                            className="px-4 py-2 bg-card text-white rounded disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Single User Gift Credits Modal */}
            <GiftCreditsModal
                isOpen={giftModalOpen}
                onClose={() => {
                    setGiftModalOpen(false);
                    setSelectedUser(null);
                }}
                onConfirm={handleGiftCredits}
                userName={selectedUser?.name || ""}
                loading={gifting}
            />

            {/* Bulk Gift Credits Modal */}
            <GiftCreditsModal
                isOpen={bulkGiftModalOpen}
                onClose={() => setBulkGiftModalOpen(false)}
                onConfirm={handleBulkGiftCredits}
                loading={bulkGifting}
                isBulk={true}
                userCount={total}
            />
        </div>
    );
}