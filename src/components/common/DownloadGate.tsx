import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import LimitService from '@/services/limitService';
import { useI18n } from '@/hooks/useI18n';
import { Zap, Download, Check, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DownloadGateProps {
    toolId: string;
    onDownload: (watermarked: boolean) => void;
    filename?: string;
    children?: React.ReactNode;
    className?: string;
    showWatermarkLabel?: boolean;
    label?: string;
    watermarkLabel?: string;
}

export const DownloadGate: React.FC<DownloadGateProps> = ({
    toolId,
    onDownload,
    children,
    className,
    showWatermarkLabel = false,
    label,
    watermarkLabel
}) => {
    const { status, isPremium } = useSubscription();
    const { t } = useI18n();
    const [remaining, setRemaining] = useState(() => LimitService.getRemainingProDownloads(status));
    const isProTool = LimitService.isProTool(toolId);

    useEffect(() => {
        const handleUpdate = () => {
            setRemaining(LimitService.getRemainingProDownloads(status));
        };
        window.addEventListener('localpdf:limits_updated', handleUpdate);
        return () => window.removeEventListener('localpdf:limits_updated', handleUpdate);
    }, [status]);

    const handleDownloadClean = () => {
        if (remaining > 0 || isPremium) {
            LimitService.recordDownload(toolId, status, false);
            onDownload(false);
        }
    };

    const handleDownloadWatermarked = () => {
        onDownload(true);
    };

    const handleUpgrade = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.hash = '#upgrade';
    };

    // 1. Free tool or Premium user
    if (!isProTool || isPremium) {
        const handleClick = () => onDownload(false);
        if (children) {
            return <div onClick={handleClick} className={className}>{children}</div>;
        }
        return (
            <Button onClick={handleClick} className={`${className} h-11 rounded-xl`}>
                <Download className="mr-2 h-4 w-4" />
                {label || t('common.download')}
            </Button>
        );
    }

    // 2. Pro tool for Free user - Limit reached, but tool supports watermarking
    if (remaining === 0 && showWatermarkLabel) {
        return (
            <Button
                onClick={handleDownloadWatermarked}
                className={`${className} bg-ocean-600 hover:bg-ocean-700 text-white shadow-lg h-11 rounded-xl font-bold`}
            >
                <Download className="mr-2 h-4 w-4 text-ocean-200" />
                {watermarkLabel || t('monetization.download_with_watermark')}
            </Button>
        );
    }

    // 3. Pro tool for Free user - Limit reached, no watermarking supported
    if (remaining === 0 && !showWatermarkLabel) {
        return (
            <Button
                onClick={handleUpgrade}
                className={`${className} bg-amber-500 hover:bg-amber-600 text-white shadow-lg h-11 rounded-xl font-bold`}
                title={t('monetization.daily_limit_reached')}
            >
                <Zap className="mr-2 h-4 w-4 fill-current" />
                {t('monetization.upgrade_to_download')}
            </Button>
        );
    }

    // 4. Pro tool for Free user - Has limits and supports choice
    if (showWatermarkLabel) {
        if (children) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="relative inline-block cursor-pointer group">
                            {children}
                            <span className="absolute -top-1.5 -right-1.5 bg-accent-blue text-white text-[9px] font-black min-w-[16px] h-[16px] flex items-center justify-center rounded-full shadow-sm z-10 border border-white dark:border-gray-900 animate-in zoom-in-50 duration-300">
                                {remaining}
                            </span>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 glass-premium dark:glass-premium-dark border-ocean-200/20 p-2 shadow-2xl">
                        <DropdownMenuItem
                            onClick={handleDownloadClean}
                            className="flex items-center gap-3 p-3 cursor-pointer rounded-xl focus:bg-green-50 dark:focus:bg-green-900/20 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{t('monetization.download_pro_clean')}</span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {t('monetization.daily_free_downloads_left', { count: remaining })}
                                </span>
                            </div>
                            <Check className="ml-auto w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100" />
                        </DropdownMenuItem>

                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                        <DropdownMenuItem
                            onClick={handleDownloadWatermarked}
                            className="flex items-center gap-3 p-3 cursor-pointer rounded-xl focus:bg-ocean-50 dark:focus:bg-ocean-900/20 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center text-ocean-600">
                                <Droplet className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{t('monetization.download_with_watermark')}</span>
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-wider">
                                    {t('monetization.features.unlimited')}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return (
            <>
                <Button
                    onClick={handleDownloadClean}
                    className={`${className} bg-ocean-600 hover:bg-ocean-700 text-white shadow-lg relative h-11 rounded-xl group transition-all active:scale-95 px-6`}
                >
                    <Download className="mr-3 h-5 w-5" />
                    <span className="font-bold text-sm transition-transform group-hover:-translate-x-1">{t('monetization.download_pro_clean')}</span>
                    <span className="ml-3 bg-white/20 text-white text-[10px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full backdrop-blur-md">
                        {remaining}
                    </span>
                </Button>

                <Button
                    onClick={handleDownloadWatermarked}
                    variant="ghost"
                    className="h-11 px-6 rounded-xl text-ocean-600 dark:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-900/20 font-bold transition-all active:scale-95 border-2 border-transparent hover:border-ocean-100 dark:hover:border-ocean-900/40"
                >
                    <Droplet className="mr-2 h-5 w-5 opacity-70" />
                    {watermarkLabel || t('monetization.download_with_watermark')}
                </Button>
            </>
        );
    }

    // 5. Pro tool for Free user - Has limits, no watermarking (standard limit behavior)
    return (
        <Button
            onClick={handleDownloadClean}
            className={`${className} bg-green-600 hover:bg-green-700 text-white shadow-lg relative h-11 rounded-xl`}
            title={t('monetization.daily_free_downloads_left', { count: remaining })}
        >
            <Download className="mr-2 h-4 w-4" />
            {label || t('common.download')}
            <span className="absolute -top-1.5 -right-2 bg-accent-blue text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-900">
                {remaining}
            </span>
        </Button>
    );
};
