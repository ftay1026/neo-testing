import { X, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExtendCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string, newExpiry: string) => Promise<void>;
  customerName: string;
  customerId: string;
  currentExpiry: string;
  loading?: boolean;
}

export default function ExtendCreditModal({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  customerId,
  currentExpiry,
  loading = false,
}: ExtendCreditModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Get minimum date (current expiry date)
  const minDate = new Date(currentExpiry).toISOString().split("T")[0];
  
  // Get maximum date (2 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleConfirm = async () => {
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    const selected = new Date(selectedDate);
    const current = new Date(currentExpiry);

    if (selected <= current) {
      setError("New expiry date must be after the current expiry date");
      return;
    }

    setError("");
    await onConfirm(customerId, selectedDate);
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedDate("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full shadow-2xl border border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Extend Credit Expiry</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-dashboard-bg rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Customer:</span>
              <span className="text-white font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Current Expiry:</span>
              <span className="text-orange-500 font-medium">
                {new Date(currentExpiry).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              New Expiry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError("");
              }}
              min={minDate}
              max={maxDateStr}
              disabled={loading}
              className="w-full px-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">
              Select a date after {new Date(currentExpiry).toLocaleDateString()}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          {selectedDate && !error && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                Credits will be extended to:{" "}
                <span className="text-green-500 font-bold">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-primary/10">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedDate}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extending...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}