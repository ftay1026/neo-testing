import { X, Gift, Loader2, Calendar, Hash, Users } from "lucide-react";
import { useState, useEffect } from "react";

// ===================================================
// CREATE GIFT CODE MODAL
// ===================================================

interface CreateGiftCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    code: string;
    creditsAmount: number;
    maxUses: number;
    expiresAt: string;
  }) => Promise<{ success: boolean; message: string }>;
  loading?: boolean;
}

interface CreateGiftCodeParams {
  code: string;
  credits_amount: number;
  max_uses: number;
  expires_at: string;
}

export function CreateGiftCodeModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: CreateGiftCodeModalProps) {
  const [formData, setFormData] = useState<CreateGiftCodeParams>({
    code: "",
    credits_amount: 100,
    max_uses: 1,
    expires_at: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        expires_at: defaultExpiry.toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateRandomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += "-";
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData({ ...formData, code });
    setErrors({ ...errors, code: "" });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Gift code is required";
    } else if (formData.code.length < 4) {
      newErrors.code = "Code must be at least 4 characters";
    }

    if (formData.credits_amount <= 0) {
      newErrors.credits_amount = "Credits must be greater than 0";
    }

    if (formData.max_uses <= 0) {
      newErrors.max_uses = "Max uses must be at least 1";
    }

    if (!formData.expires_at) {
      newErrors.expires_at = "Expiry date is required";
    } else {
      const selectedDate = new Date(formData.expires_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.expires_at = "Expiry date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Transform snake_case to camelCase for hook
    const payload = {
      code: formData.code,
      creditsAmount: formData.credits_amount,
      maxUses: formData.max_uses,
      expiresAt: formData.expires_at,
    };

    const result = await onConfirm(payload);
    if (result.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        code: "",
        credits_amount: 100,
        max_uses: 1,
        expires_at: "",
      });
      setErrors({});
      onClose();
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-lg w-full shadow-2xl border border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Create Gift Code</h3>
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
        <div className="p-6 space-y-4">
          {/* Gift Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Gift Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value.toUpperCase() });
                  setErrors({ ...errors, code: "" });
                }}
                placeholder="Enter or generate code"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 font-mono"
              />
              <button
                onClick={generateRandomCode}
                disabled={loading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            {errors.code && <p className="text-red-500 text-xs">{errors.code}</p>}
          </div>

          {/* Credits Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Credits Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.credits_amount}
                onChange={(e) => {
                  setFormData({ ...formData, credits_amount: parseInt(e.target.value) || 0 });
                  setErrors({ ...errors, credits_amount: "" });
                }}
                min="1"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.credits_amount && (
              <p className="text-red-500 text-xs">{errors.credits_amount}</p>
            )}
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Max Uses <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) => {
                  setFormData({ ...formData, max_uses: parseInt(e.target.value) || 1 });
                  setErrors({ ...errors, max_uses: "" });
                }}
                min="1"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.max_uses && <p className="text-red-500 text-xs">{errors.max_uses}</p>}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => {
                  setFormData({ ...formData, expires_at: e.target.value });
                  setErrors({ ...errors, expires_at: "" });
                }}
                min={minDate}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.expires_at && <p className="text-red-500 text-xs">{errors.expires_at}</p>}
          </div>

          {/* Preview */}
          {formData.code && formData.credits_amount > 0 && formData.expires_at && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <span className="font-mono font-bold text-blue-400">{formData.code}</span> will grant{" "}
                <span className="font-bold text-white">{formData.credits_amount.toLocaleString()}</span>{" "}
                credits and can be used{" "}
                <span className="font-bold text-white">{formData.max_uses}</span> time(s) until{" "}
                <span className="font-bold text-white">
                  {new Date(formData.expires_at).toLocaleDateString()}
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
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Gift Code"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


// ===================================================
// EDIT GIFT CODE MODAL
// ===================================================

interface EditGiftCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, params: EditGiftCodeParams) => Promise<{ success: boolean; message: string }>;
  giftCode: {
    id: string;
    code: string;
    credits_amount: number;
    max_uses: number;
    current_uses: number;
    expires_at: string;
  } | null;
  loading?: boolean;
}

interface EditGiftCodeParams {
  creditsAmount?: number;
  maxUses?: number;
  expiresAt?: string;
}

export function EditGiftCodeModal({
  isOpen,
  onClose,
  onConfirm,
  giftCode,
  loading = false,
}: EditGiftCodeModalProps) {
  const [formData, setFormData] = useState<EditGiftCodeParams>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && giftCode) {
      setFormData({
        creditsAmount: giftCode.credits_amount,
        maxUses: giftCode.max_uses,
        expiresAt: new Date(giftCode.expires_at).toISOString().split("T")[0],
      });
    }
  }, [isOpen, giftCode]);

  if (!isOpen || !giftCode) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.creditsAmount !== undefined && formData.creditsAmount <= 0) {
      newErrors.credits_amount = "Credits must be greater than 0";
    }

    if (formData.maxUses !== undefined && formData.maxUses < giftCode.current_uses) {
      newErrors.max_uses = `Max uses cannot be less than current uses (${giftCode.current_uses})`;
    }

    if (formData.expiresAt) {
      const selectedDate = new Date(formData.expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.expires_at = "Expiry date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await onConfirm(giftCode.id, formData);
    if (result.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({});
      setErrors({});
      onClose();
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-lg w-full shadow-2xl border border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Gift className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Edit Gift Code</h3>
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
        <div className="p-6 space-y-4">
          {/* Code Info (Read-only) */}
          <div className="bg-dashboard-bg rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Code:</span>
              <span className="text-white font-mono font-bold">{giftCode.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Current Uses:</span>
              <span className="text-white font-medium">
                {giftCode.current_uses} / {giftCode.max_uses}
              </span>
            </div>
          </div>

          {/* Credits Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Credits Amount</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.creditsAmount ?? ""}
                onChange={(e) => {
                  setFormData({ ...formData, creditsAmount: parseInt(e.target.value) || 0 });
                  setErrors({ ...errors, credits_amount: "" });
                }}
                min="1"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.credits_amount && (
              <p className="text-red-500 text-xs">{errors.credits_amount}</p>
            )}
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Max Uses</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.maxUses ?? ""}
                onChange={(e) => {
                  setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 });
                  setErrors({ ...errors, max_uses: "" });
                }}
                min={giftCode.current_uses}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.max_uses && <p className="text-red-500 text-xs">{errors.max_uses}</p>}
            <p className="text-xs text-gray-400">
              Must be at least {giftCode.current_uses} (current uses)
            </p>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.expiresAt ?? ""}
                onChange={(e) => {
                  setFormData({ ...formData, expiresAt: e.target.value });
                  setErrors({ ...errors, expires_at: "" });
                }}
                min={minDate}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-dashboard-bg border border-primary/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
              />
            </div>
            {errors.expires_at && <p className="text-red-500 text-xs">{errors.expires_at}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-primary/10">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}