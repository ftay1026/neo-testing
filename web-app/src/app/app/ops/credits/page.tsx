"use client";

import { Gift, Clock, Ticket, Plus, AlertCircle, Loader2 } from "lucide-react";
import StatCard from "@/components/dashborad/StatCard";
import DataTable, { Column } from "@/components/dashborad/DataTable";
import ExtendCreditModal from "@/components/dashborad/ExtendCreditModal";
import { CreateGiftCodeModal, EditGiftCodeModal } from "@/components/dashborad/CreateGiftCode";
import {
  useExpiringCredits,
  useTotalExpiringCredits,
  useTotalPositiveCredits,
  useExtendCreditExpiry
} from '@/hooks/admin/use-credits';
import {
  useGiftCodes,
  useDeactivateGiftCode,
  useCreateGiftCode,
  useEditGiftCode,
  type GiftCode as GiftCodeType
} from '@/hooks/admin/use-gift-code';
import { useState } from "react";

interface CreditUser {
  user: string;
  email: string;
  credits: number;
  expiresOn: string;
  daysLeft: number;
  customerId: string; // Added for API call
}

export default function CreditManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGiftCode, setEditingGiftCode] = useState<GiftCodeType | null>(null);
  const [extendModal, setExtendModal] = useState<{
    isOpen: boolean;
    customerName: string;
    customerId: string;
    currentExpiry: string;
  }>({
    isOpen: false,
    customerName: "",
    customerId: "",
    currentExpiry: "",
  });

  // Fetch credits data
  const {
    credits: expiringCreditsData,
    loading: creditsLoading,
    error: creditsError,
    refetch: refetchCredits
  } = useExpiringCredits(90);

  const {
    total: totalExpiring,
    loading: totalExpiringLoading
  } = useTotalExpiringCredits(90);

  const {
    total: totalIssued,
    loading: totalIssuedLoading
  } = useTotalPositiveCredits();

  // Fetch gift codes data
  const {
    codes: giftCodesData,
    loading: giftCodesLoading,
    error: giftCodesError,
    refetch: refetchGiftCodes
  } = useGiftCodes();

  const {
    deactivateGiftCode,
    loading: deactivating
  } = useDeactivateGiftCode();

  const {
    createGiftCode,
    loading: creatingGiftCode
  } = useCreateGiftCode();
  const {
    editGiftCode,
    loading: editingGiftCodeLoading
  } = useEditGiftCode();

  // Extend credit expiry hook
  const {
    extendExpiry,
    loading: extendingExpiry
  } = useExtendCreditExpiry();

  // Transform expiring credits data for table
  const expiringCredits: CreditUser[] = expiringCreditsData.map(credit => ({
    user: credit.full_name || 'Unknown User',
    email: credit.email,
    credits: credit.credits,
    expiresOn: new Date(credit.expires_at).toLocaleDateString(),
    daysLeft: credit.days_left,
    customerId: credit.customer_id, // Make sure this field exists in your API response
  }));

  // Count active gift codes
  const activeGiftCodes = giftCodesData.filter(code => code.is_active).length;

  // Handle open extend modal
  const handleOpenExtendModal = (credit: CreditUser) => {
    setExtendModal({
      isOpen: true,
      customerName: credit.user,
      customerId: credit.customerId,
      currentExpiry: credit.expiresOn,
    });
  };

  // Handle extend credit expiry
  const handleExtendExpiry = async (customerId: string, newExpiry: string) => {
    const success = await extendExpiry(customerId, newExpiry);
    if (success) {
      alert('Credit expiry extended successfully!');
      setExtendModal({ isOpen: false, customerName: "", customerId: "", currentExpiry: "" });
      refetchCredits(); // Refresh the data
    } else {
      alert('Failed to extend credit expiry. Please try again.');
    }
  };

  // Handle deactivate gift code
  const handleDeactivate = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to deactivate the gift code "${code}"?`)) {
      const result = await deactivateGiftCode(id);
      if (result.success) {
        alert(result.message);
        refetchGiftCodes();
      } else {
        alert(`Failed: ${result.message}`);
      }
    }
  };

  const handleCreateGiftCode = async (params: Parameters<typeof createGiftCode>[0]) => {
    const result = await createGiftCode(params);
    if (result.success) {
      alert(result.message);
      refetchGiftCodes();
      setShowCreateModal(false);
    } else {
      alert(result.message);
    }
    return result;
  };

  const handleEditGiftCode = async (id: string, params: Parameters<typeof editGiftCode>[1]) => {
    const result = await editGiftCode(id, params);
    if (result.success) {
      alert(result.message);
      refetchGiftCodes();
      setEditingGiftCode(null);
    } else {
      alert(result.message);
    }
    return result;
  };

  // Stats data with real values
  const stats = [
    {
      title: "Total Credits Issued",
      value: totalIssuedLoading ? "..." : totalIssued.toLocaleString(),
      icon: <Gift className="w-5 h-5" />
    },
    {
      title: "Credits Expiring Soon",
      value: totalExpiringLoading ? "..." : totalExpiring.toLocaleString(),
      icon: <Clock className="w-5 h-5" />
    },
    {
      title: "Active Gift Codes",
      value: giftCodesLoading ? "..." : activeGiftCodes.toString(),
      icon: <Ticket className="w-5 h-5" />
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
          className={`px-3 py-1 rounded-lg text-xs font-medium ${value < 30
              ? "bg-red-500 text-white"
              : value < 60
                ? "bg-orange-500 text-white"
                : "bg-green-500 text-white"
            }`}
        >
          {value} days
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <button
          onClick={() => handleOpenExtendModal(row)}
          className="px-6 py-3 bg-white hover:bg-primary/50 text-card rounded-md text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Extend
        </button>
      ),
    },
  ];

  // Gift codes columns
  const giftCodeColumns: Column<GiftCodeType>[] = [
    {
      key: "code",
      header: "Code",
      className: "text-primary/70 font-mono",
    },
    {
      key: "credits_amount",
      header: "Credits",
      render: (value) => value.toLocaleString(),
    },
    {
      key: "current_uses",
      header: "Uses",
      render: (_, row) => `${row.current_uses} / ${row.max_uses}`,
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-lg text-xs font-medium ${value === "active"
              ? "bg-green-500 text-white"
              : value === "expired"
                ? "bg-red-500 text-white"
                : "bg-gray-500 text-white"
            }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "expires_at",
      header: "Expiry",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-white hover:bg-primary/70 text-card rounded-md text-sm transition-colors"
            onClick={() => setEditingGiftCode(row)}
          >
            Edit
          </button>
          <button
            className="px-4 py-2 bg-secondary-status hover:bg-secondary-status/50 text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleDeactivate(row.id, row.code)}
            disabled={deactivating || !row.is_active}
          >
            {deactivating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Deactivate'
            )}
          </button>
        </div>
      ),
    },
  ];

  // Loading state
  if (creditsLoading && giftCodesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-white">Loading credit data...</p>
        </div>
      </div>
    );
  }

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

        {/* Error Messages */}
        {creditsError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error loading credits:</p>
            <p>{creditsError}</p>
          </div>
        )}

        {giftCodesError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error loading gift codes:</p>
            <p>{giftCodesError}</p>
          </div>
        )}

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
            <div className="flex flex-col justify-between space-y-8 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-orange-500">
                    Credits Expiring Soon (90 Days)
                  </h2>
                </div>
                <button
                  onClick={refetchCredits}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-card border border-orange-900/30 rounded-xl">
                {creditsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <DataTable
                    columns={creditColumns}
                    data={expiringCredits}
                    emptyMessage="No credits expiring soon"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gift Codes Section */}
        <div className="bg-dashboard-bg p-8 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Gift Codes</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Gift Code
            </button>
          </div>
          <div className="rounded-xl shadow-lg overflow-hidden">
            {giftCodesLoading ? (
              <div className="flex items-center justify-center p-8 bg-card">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                columns={giftCodeColumns}
                data={giftCodesData}
                emptyMessage="No gift codes available"
              />
            )}
          </div>
        </div>
      </div>

      {/* Extend Credit Modal */}
      <ExtendCreditModal
        isOpen={extendModal.isOpen}
        onClose={() => setExtendModal({ isOpen: false, customerName: "", customerId: "", currentExpiry: "" })}
        onConfirm={handleExtendExpiry}
        customerName={extendModal.customerName}
        customerId={extendModal.customerId}
        currentExpiry={extendModal.currentExpiry}
        loading={extendingExpiry}
      />

      {/* Create Gift Code Modal */}
      <CreateGiftCodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateGiftCode}
        loading={creatingGiftCode}
      />

      <EditGiftCodeModal
        isOpen={!!editingGiftCode}
        giftCode={editingGiftCode}
        onClose={() => setEditingGiftCode(null)}
        onConfirm={handleEditGiftCode}
        loading={editingGiftCodeLoading}
      />
    </div>
  );
}