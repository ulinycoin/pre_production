import type { SubscriptionInfo } from '@/services/subscriptionService';
import monetizationData from '@/config/monetization.json';

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

const STORAGE_KEY = 'localpdf_downloads_tracker';

interface DownloadTracker {
    date: string;
    downloadedToolIds: string[];
}

class LimitService {
    static canProcessFile(file: File, subStatus: SubscriptionInfo['status'], maxSizeOverride?: number): { can: boolean; reason?: string } {
        const isPremium = subStatus === 'pro' || subStatus === 'lifetime';
        const limit = maxSizeOverride ?? (isPremium ? PRO_LIMITS.MAX_FILE_SIZE_MB : FREE_LIMITS.MAX_FILE_SIZE_MB);
        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > limit) {
            return {
                can: false,
                reason: isPremium
                    ? 'upload.errors.fileTooLargePro'
                    : 'upload.errors.fileTooLargeFree'
            };
        }

        return { can: true };
    }

    /**
     * Check if a batch of files can be processed
     */
    static canBatchProcess(count: number, subStatus: SubscriptionInfo['status'], maxFilesOverride?: number): { can: boolean; reason?: string } {
        const isPremium = subStatus === 'pro' || subStatus === 'lifetime';
        const limit = maxFilesOverride ?? (isPremium ? PRO_LIMITS.MAX_BATCH_FILES : FREE_LIMITS.MAX_BATCH_FILES);

        if (count > limit) {
            return {
                can: false,
                reason: isPremium
                    ? 'upload.errors.tooManyFilesPro'
                    : 'upload.errors.tooManyFilesFree'
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

    /**
     * Check if a tool is a PRO tool
     */
    static isProTool(toolId: string): boolean {
        return monetizationData.limits.PRO_TOOLS.includes(toolId);
    }

    /**
     * Get remaining free PRO downloads for today
     */
    static getRemainingProDownloads(subStatus: SubscriptionInfo['status']): number {
        if (subStatus !== 'free') return Infinity;

        const tracker = this.getTracker();
        const dailyLimit = monetizationData.limits.DAILY_FREE_PRO_DOWNLOADS;

        return Math.max(0, dailyLimit - tracker.downloadedToolIds.length);
    }

    /**
     * Record a download for a tool
     */
    static recordDownload(toolId: string, subStatus: SubscriptionInfo['status'], isWatermarked: boolean = false): void {
        if (subStatus !== 'free' || !this.isProTool(toolId) || isWatermarked) return;

        const tracker = this.getTracker();
        tracker.downloadedToolIds.push(toolId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));

        // Dispatch event so UI can update
        window.dispatchEvent(new CustomEvent('localpdf:limits_updated'));
    }

    /**
     * Get or initialize the download tracker from localStorage
     */
    private static getTracker(): DownloadTracker {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
            try {
                const tracker: DownloadTracker = JSON.parse(stored);
                if (tracker.date === today) {
                    return tracker;
                }
            } catch (e) {
                console.error('Failed to parse download tracker', e);
            }
        }

        // Initialize new day
        const tracker: DownloadTracker = { date: today, downloadedToolIds: [] };
        return tracker;
    }
}

export default LimitService;
