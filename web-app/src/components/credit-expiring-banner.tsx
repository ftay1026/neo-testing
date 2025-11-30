'use client';

import { useState } from 'react';
import { X, AlertTriangle, Calendar, Package, Clock } from 'lucide-react';
import { useGracePeriod } from '@/hooks/use-grace-period';

export function ExpiringCreditsBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasGraceCredits, totalExpiring, daysRemaining, batches, isLoading } = useGracePeriod();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  if (isLoading || !hasGraceCredits) return null;

  return (
    <>
      {/* Banner */}
      <div className="w-full bg-[#262624]">
        <div className="max-w-md mx-auto px-4 py-2 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-white" />
            <p className="text-white text-sm">
              You have <b>{totalExpiring.toLocaleString()}</b> credits expiring in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#18181B] text-white px-3 py-1 rounded-sm text-sm font-medium hover:bg-[#27272A] transition-colors"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#18181B] w-full max-w-sm rounded-md shadow-lg overflow-y-auto max-h-[80vh] text-white">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-bold">Expiring Credits</h2>
                <p className="text-sm text-gray-400">
                  {totalExpiring.toLocaleString()} credits in {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-800 rounded transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="p-3 border border-gray-700 rounded-sm hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{batch.remaining_credits.toLocaleString()} Credits</div>
                      <div className="text-sm text-gray-300">{batch.description || 'Credit Package'}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      batch.days_remaining <= 2 ? 'bg-red-900/50 text-red-200' :
                      batch.days_remaining <= 5 ? 'bg-amber-900/50 text-amber-200' :
                      'bg-gray-800 text-gray-200'
                    }`}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {batch.days_remaining} {batch.days_remaining === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3" /> Purchase: {formatDate(batch.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Main Expiry: {formatDate(batch.expires_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" /> Final Expiry: <b>{formatDate(batch.grace_period_ends_at)}</b>
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-500" />
                Credits past final expiry will be permanently removed.
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 border border-gray-700 rounded-sm text-sm hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => (window.location.href = '/app/credits')}
                className="px-3 py-1 bg-gray-800 rounded-sm text-sm hover:bg-gray-700 transition-colors"
              >
                Purchase More
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
