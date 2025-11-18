"use client";
import { Gift, Ban, UserX, Search, X } from "lucide-react";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import { useCustomers } from "@/hooks/admin/use-customers";
import { useEffect, useState } from "react";
import { useAddCredits } from "@/hooks/admin/use-credits";

// Gift Credits Modal Component
function GiftCreditsModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    userName, 
    loading,
    isBulk = false,
    userCount = 0
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (amount: number, description: string) => void; 
    userName?: string;
    loading: boolean;
    isBulk?: boolean;
    userCount?: number;
}) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState(isBulk ? "Bulk admin gift" : "Admin gifted credits");

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount("");
            setDescription(isBulk ? "Bulk admin gift" : "Admin gifted credits");
        }
    }, [isOpen, isBulk]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const numAmount = parseInt(amount);
        if (numAmount > 0) {
            onConfirm(numAmount, description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dashboard-bg rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-primary/10">
                    <h2 className="text-xl font-semibold text-white">
                        {isBulk ? "Bulk Gift Credits" : "Gift Credits"}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-primary/50 hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {isBulk ? (
                        <div className="bg-card/50 p-4 rounded-lg">
                            <p className="text-sm text-primary/70">
                                This will add credits to{" "}
                                <span className="text-white font-semibold">{userCount}</span> users
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm text-primary/70 mb-2">
                                User: <span className="text-white font-medium">{userName}</span>
                            </label>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-primary/70 mb-2">
                            {isBulk ? "Credit Amount per User" : "Credit Amount"}
                        </label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Enter amount..."
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-card text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-primary/50 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-primary/70 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            placeholder={isBulk ? "Reason for bulk gift..." : "Reason for gift..."}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-card text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-primary/50 disabled:opacity-50"
                        />
                    </div>

                    {isBulk && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                            <p className="text-sm text-yellow-500/90">
                                ⚠️ This action will gift credits to all users on this page and cannot be undone.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 bg-background border-t border-primary/10">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-card hover:bg-card/70 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !amount || parseInt(amount) <= 0}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Gift className="w-4 h-4" />
                                {isBulk ? "Confirm Bulk Gift" : "Confirm Gift"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GiftCreditsModal;