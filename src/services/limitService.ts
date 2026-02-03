import { SubscriptionInfo } from '@/services/subscriptionService';

export const FREE_LIMITS = {
    MAX_FILE_SIZE_MB: 50,
    MAX_BATCH_FILES: 2,
    MAX_PAGES: 50,
};

export const PRO_LIMITS = {
    MAX_FILE_SIZE_MB: 2000, // Effectively hardware limit
    MAX_BATCH_FILES: 50,
    MAX_PAGES: 5000,
};

class LimitService {
    /**
     * Check if a file can be processed based on size
     */
    static canProcessFile(file: File, subStatus: SubscriptionInfo['status']): { can: boolean; reason?: string } {
        const isPremium = subStatus === 'pro' || subStatus === 'lifetime';
        const limit = isPremium ? PRO_LIMITS.MAX_FILE_SIZE_MB : FREE_LIMITS.MAX_FILE_SIZE_MB;
        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > limit) {
            return {
                can: false,
                reason: isPremium
                    ? `File is too large even for PRO (${limit}MB limit)`
                    : `File exceeds 50MB free limit. Upgrade to PRO for unlimited size.`
            };
        }

        return { can: true };
    }

    /**
     * Check if a batch of files can be processed
     */
    static canBatchProcess(count: number, subStatus: SubscriptionInfo['status']): { can: boolean; reason?: string } {
        const isPremium = subStatus === 'pro' || subStatus === 'lifetime';
        const limit = isPremium ? PRO_LIMITS.MAX_BATCH_FILES : FREE_LIMITS.MAX_BATCH_FILES;

        if (count > limit) {
            return {
                can: false,
                reason: isPremium
                    ? `Batch limit reached (${limit} files)`
                    : `Free mode is limited to ${limit} files at once. Upgrade to PRO for up to 50 files.`
            };
        }

        return { can: true };
    }

    /**
     * Get formatted limits for display
     */
    static getLimits(subStatus: SubscriptionInfo['status']) {
        return subStatus === 'free' ? FREE_LIMITS : PRO_LIMITS;
    }
}

export default LimitService;
