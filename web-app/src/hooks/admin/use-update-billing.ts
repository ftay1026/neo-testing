// hooks/admin/use-update-billing-settings.ts
import { useState } from 'react';

interface BillingSettings {
    credit_value: number;
    input_rate: number;
    output_rate: number;
    margin_multiplier: number;
}

interface UpdateBillingSettingsResponse {
    message: string;
    updated: any;
}

export function useUpdateBillingSettings() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateBillingSettings = async (settings: BillingSettings) => {
        setIsUpdating(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/update-billing', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update billing settings');
            }

            const data: UpdateBillingSettingsResponse = await response.json();
            return { success: true, data };
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        updateBillingSettings,
        isUpdating,
        error,
    };
}