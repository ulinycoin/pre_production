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
            const info = await SubscriptionService.checkSubscription();
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
