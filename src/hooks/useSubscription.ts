import { useState, useEffect, useCallback } from 'react';
import SubscriptionService, { type SubscriptionInfo } from '@/services/subscriptionService';
import StorageService from '@/services/storageService';

export interface UseSubscriptionReturn extends SubscriptionInfo {
    isLoading: boolean;
    isPremium: boolean;
    refresh: () => Promise<void>;
    updateToken: (token: string) => Promise<boolean>;
}

export const useSubscription = (): UseSubscriptionReturn => {
    const [subInfo, setSubInfo] = useState<SubscriptionInfo>({
        status: 'free',
        expiresAt: null,
        token: null,
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await StorageService.init();
            let info = await SubscriptionService.checkSubscription();

            // Auto-refresh logic: 
            // 1. If premium but token is close to expiry (e.g., within 7 days)
            // 2. If free but we have a license key (token might have expired)
            const isPremium = info.status === 'pro' || info.status === 'lifetime';
            const licenseKey = await StorageService.getLicenseKey();

            let shouldRefresh = false;
            if (isPremium && info.expiresAt) {
                const now = Math.floor(Date.now() / 1000);
                const sevenDays = 7 * 24 * 60 * 60;
                if (info.expiresAt - now < sevenDays) {
                    shouldRefresh = true;
                }
            } else if (!isPremium && licenseKey) {
                shouldRefresh = true;
            }

            if (shouldRefresh) {
                console.log('Attempting sub refresh/re-exchange...');
                const success = await SubscriptionService.reExchange();
                if (success) {
                    info = await SubscriptionService.checkSubscription();
                }
            }

            setSubInfo(info);
        } catch (e) {
            console.error('Subscription refresh failed:', e);
            setSubInfo({ status: 'free', expiresAt: null, token: null });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateToken = useCallback(async (token: string) => {
        setIsLoading(true);
        try {
            const success = await SubscriptionService.saveToken(token);
            if (success) {
                await refresh();
            }
            return success;
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        ...subInfo,
        isLoading,
        isPremium: subInfo.status === 'pro' || subInfo.status === 'lifetime',
        refresh,
        updateToken,
    };
};
