// /components/dashboard/BanUserModal.tsx
"use client";

import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, bannedBy: string) => void;
  userName: string;
  adminEmail: string;
  totalSpend: number | null;
  loading: boolean;
  loadingSpend: boolean;
}

const HIGH_VALUE_THRESHOLD = 200; // $200

export default function BanUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  adminEmail,
  totalSpend,
  loading,
  loadingSpend,
}: BanUserModalProps) {
  const [reason, setReason] = useState("");
  const [bannedBy, setBannedBy] = useState(adminEmail);
  const [showHighValueWarning, setShowHighValueWarning] = useState(false);

  useEffect(() => {
    setBannedBy(adminEmail);
  }, [adminEmail]);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setBannedBy(adminEmail);
      setShowHighValueWarning(false);
    }
  }, [isOpen, adminEmail]);

  if (!isOpen) return null;

  const isHighValueCustomer = totalSpend !== null && totalSpend >= HIGH_VALUE_THRESHOLD;

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for banning this user.");
      return;
    }

    // Show warning for high-value customers
    if (isHighValueCustomer && !showHighValueWarning) {
      setShowHighValueWarning(true);
      return;
    }

    // Proceed with ban
    onConfirm(reason, bannedBy);
  };

  const handleCancelWarning = () => {
    setShowHighValueWarning(false);
  };

  const handleConfirmWarning = () => {
    onConfirm(reason, bannedBy);
  };

  // High-value customer warning overlay
  if (showHighValueWarning) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-dashboard-bg rounded-xl max-w-md w-full shadow-xl">
          {/* Warning Header */}
          <div className="flex items-center gap-3 p-4 border-b border-primary/10">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">High-Value Customer Warning</h2>
          </div>

          {/* Warning Content */}
          <div className="p-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <p className="text-yellow-500 font-medium text-center text-lg">
                This user has spent ${totalSpend?.toFixed(2)}
              </p>
            </div>
            <p className="text-white text-center mb-2">
              Are you sure you want to ban this high-value customer?
            </p>
            <p className="text-primary/50 text-sm text-center">
              This action cannot be easily undone.
            </p>
          </div>

          {/* Warning Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-primary/10">
            <button
              onClick={handleCancelWarning}
              disabled={loading}
              className="px-6 py-2 bg-card hover:bg-card/70 text-white text-sm rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmWarning}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Banning...
                </>
              ) : (
                "Confirm Ban"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main ban form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dashboard-bg rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-primary/10">
          <h2 className="text-lg font-semibold text-white">Ban User Confirmation</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-primary/50 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="bg-background-bg p-3 rounded-lg">
            <p className="text-xs text-primary/50 mb-1">User to be banned:</p>
            <p className="text-white font-medium">{userName}</p>
          </div>

         

          {/* Banned By Input */}
          <div>
            <label className="block text-xs text-primary/50 mb-1.5">
              Banned By (Admin)
            </label>
            <input
              type="text"
              value={bannedBy}
              onChange={(e) => setBannedBy(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-card text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              placeholder="Admin email or name"
            />
          </div>

          {/* Ban Reason Input */}
          <div>
            <label className="block text-xs text-primary/50 mb-1.5">
              Reason for Ban <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 bg-card text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
              placeholder="Enter the reason for banning this user..."
            />
          </div>

          {/* Warning Message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs text-red-400">
              ⚠️ This action will immediately prevent the user from accessing their account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-primary/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-card hover:bg-card/70 text-white text-sm rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Banning...
              </>
            ) : (
              "Ban User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}