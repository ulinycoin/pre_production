import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import { Check, Zap, Rocket, Infinity as InfinityIcon, ShieldCheck, Loader2 } from 'lucide-react';
import PaymentService from '@/services/paymentService';
import SubscriptionService from '@/services/subscriptionService';
import { toast } from 'sonner';
import monetizationData from '@/config/monetization.json';
import { formatPrice } from '@/utils/currency';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TierKey = keyof typeof monetizationData.tiers;
type TierInfo = (typeof monetizationData.tiers)[TierKey];

interface LemonSqueezySuccessDetail {
    data?: { attributes?: { first_order_item?: { license_key?: string } } };
    checkout?: { order?: { license_keys?: string[] } };
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const { status, expiresAt, refresh } = useSubscription();
    const [activeTab, setActiveTab] = useState<'plans' | 'restore' | 'status'>('plans');
    const [licenseKey, setLicenseKey] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            refresh();
        }
    }, [isOpen, refresh]);

    const handlePurchase = async (tier: 'pro' | 'lifetime') => {
        try {
            await PaymentService.openCheckout(tier);
        } catch (e) {
            console.error('Purchase failed:', e);
            toast.error('Failed to open checkout. Please try again.');
        }
    };

    const handleRestore = async (key?: string) => {
        const finalKey = key || licenseKey;
        if (!finalKey) return;
        setIsRestoring(true);
        try {
            const success = await SubscriptionService.saveToken(finalKey);
            if (success) {
                await refresh();
                toast.success('Subscription activated successfully!');
                onClose();
            } else {
                if (!key) toast.error('Invalid license key or subscription expired.');
            }
        } catch (e) {
            console.error('Activation failed:', e);
            if (!key) toast.error('Activation failed. Please check your connection.');
        } finally {
            setIsRestoring(false);
        }
    };

    // Auto-activation logic for LemonSqueezy
    useEffect(() => {
        const handleLSSuccess = (event: Event) => {
            console.log('LemonSqueezy Success Event:', event);
            // LS Overlay dispatches events to window with 'LemonSqueezy.Checkout.Success'
            // or we might need to use LemonSqueezy.on if using the JS object
            // orderData is available in event.detail?.data?.attributes || event.detail?.checkout?.order

            const detail = (event as CustomEvent<LemonSqueezySuccessDetail>).detail;
            const licenseKey = detail?.data?.attributes?.first_order_item?.license_key ||
                detail?.checkout?.order?.license_keys?.[0];

            if (licenseKey) {
                handleRestore(licenseKey);
            }
        };

        window.addEventListener('LemonSqueezy.Checkout.Success', handleLSSuccess);
        return () => window.removeEventListener('LemonSqueezy.Checkout.Success', handleLSSuccess);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white dark:bg-privacy-900 border-neutral-200 dark:border-white/10 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('monetization.upgrade_now')}</DialogTitle>
                    <DialogDescription>{t('monetization.choose_plan')}</DialogDescription>
                </DialogHeader>
                <div className="card-glass pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row h-full">
                    {/* Left Side: Illustration / Benefits */}
                    <div className="md:w-1/4 bg-neutral-50 dark:bg-privacy-800 p-8 border-r border-neutral-200 dark:border-white/5 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 dark:border-accent-blue/30 text-[10px] font-bold uppercase tracking-wider">
                                <Zap size={10} /> LocalPDF PRO
                            </div>
                            <h2 className="text-2xl font-bold text-privacy-900 dark:text-white font-outfit">
                                {t('monetization.upgrade_now')}
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    t('monetization.features.no_limits'),
                                    t('monetization.features.batch'),
                                    t('monetization.features.tier3'),
                                    t('monetization.features.support')
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-gray-400">
                                        <Check size={16} className="text-accent-blue mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-8">
                            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-none">
                                <p className="text-[10px] text-neutral-400 dark:text-gray-500 leading-relaxed uppercase tracking-tight font-bold">
                                    Privacy Sanctuary
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                                    All processing stays local. Your subscription key is verified anonymously.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Options */}
                    <div className="md:w-3/4 p-8">
                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'plans' ? 'text-privacy-900 dark:text-white border-accent-blue' : 'text-neutral-400 dark:text-gray-500 border-transparent hover:text-neutral-600 dark:hover:text-gray-300'}`}
                            >
                                {t('monetization.choose_plan')}
                            </button>
                            <button
                                onClick={() => setActiveTab('restore')}
                                className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'restore' ? 'text-privacy-900 dark:text-white border-accent-blue' : 'text-neutral-400 dark:text-gray-500 border-transparent hover:text-neutral-600 dark:hover:text-gray-300'}`}
                            >
                                {t('monetization.restore')}
                            </button>
                            {status !== 'free' && (
                                <button
                                    onClick={() => setActiveTab('status')}
                                    className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'status' ? 'text-privacy-900 dark:text-white border-accent-blue' : 'text-neutral-400 dark:text-gray-500 border-transparent hover:text-neutral-600 dark:hover:text-gray-300'}`}
                                >
                                    {t('monetization.status')}
                                </button>
                            )}
                        </div>

                        {activeTab === 'plans' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(Object.entries(monetizationData.tiers) as [TierKey, TierInfo][])
                                    .map(([key, tier]) => (
                                    <div
                                        key={key}
                                        className={`group relative p-6 rounded-[2rem] transition-all flex flex-col ${key === 'lifetime'
                                            ? 'bg-accent-blue text-white shadow-xl shadow-accent-blue/20 hover:scale-[1.02] border border-white/20'
                                            : 'bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-accent-blue/50 hover:scale-[1.02] shadow-xl hover:shadow-accent-blue/5'
                                            }`}
                                    >
                                        {key === 'lifetime' && (
                                            <div className="absolute top-4 right-4 text-white opacity-40">
                                                <InfinityIcon size={20} />
                                            </div>
                                        )}
                                        {key === 'pro' && (
                                            <div className="absolute top-4 right-4 text-accent-blue opacity-20 group-hover:opacity-100 transition-opacity">
                                                <Rocket size={18} />
                                            </div>
                                        )}

                                        <h3 className={`text-md font-bold mb-1 ${key === 'lifetime' ? 'text-white' : 'text-privacy-900 dark:text-white'}`}>
                                            {t(`monetization.${key}.name`)}
                                        </h3>

                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className={`text-xl font-bold ${key === 'lifetime' ? 'text-white' : 'text-privacy-900 dark:text-white'}`}>
                                                {formatPrice(tier.price, tier.currency)}
                                            </span>
                                            <span className={`text-[10px] ${key === 'lifetime' ? 'opacity-70' : 'text-neutral-400 dark:text-gray-500'}`}>
                                                /{tier.interval === 'once' ? t('monetization.once') : t(`monetization.intervals.${tier.interval}`)}
                                            </span>
                                        </div>

                                        <p className={`text-xs mb-6 flex-1 ${key === 'lifetime' ? 'opacity-80' : 'text-neutral-500 dark:text-gray-400'}`}>
                                            {t(`monetization.${key}.description`)}
                                        </p>

                                        <Button
                                            onClick={() => key !== 'free' && handlePurchase(key as 'pro' | 'lifetime')}
                                            disabled={key === 'free'}
                                            variant={key === 'lifetime' ? 'ghost' : 'default'}
                                            className={`w-full rounded-xl font-bold transition-all border-none ${key === 'lifetime'
                                                ? 'bg-white text-privacy-900 hover:bg-white/90 shadow-lg'
                                                : key === 'free'
                                                    ? 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 cursor-default'
                                                    : 'bg-accent-blue dark:bg-white/10 hover:bg-accent-blue text-white dark:text-white'
                                                }`}
                                        >
                                            {t(`monetization.${key}.cta`)}
                                        </Button>

                                        {key === 'lifetime' && (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'restore' ? (
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-400 dark:text-gray-500 uppercase tracking-wider">
                                        {t('monetization.restore_hint')}
                                    </label>
                                    <input
                                        type="text"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                        placeholder="LS-XXXX-XXXX-XXXX-XXXX"
                                        className="w-full h-12 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl px-4 text-privacy-900 dark:text-white focus:outline-none focus:border-accent-blue transition-all"
                                    />
                                </div>
                                <Button
                                    onClick={() => handleRestore()}
                                    disabled={!licenseKey || isRestoring}
                                    className="w-full h-12 rounded-xl bg-accent-blue hover:bg-accent-blue/90 font-bold"
                                >
                                    {isRestoring ? (
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                    ) : null}
                                    {isRestoring ? t('common.processing') : t('monetization.restore_button')}
                                </Button>
                                <p className="text-[10px] text-gray-500 text-center">
                                    {t('monetization.restore_description')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-neutral-500 dark:text-gray-400">{t('monetization.status')}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                                            {status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-500 dark:text-gray-400">{t('monetization.expires')}</span>
                                        <span className="text-sm font-bold text-privacy-900 dark:text-white">
                                            {expiresAt
                                                ? new Date(expiresAt * 1000).toLocaleDateString()
                                                : t('monetization.never')}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={async () => {
                                        await refresh();
                                        toast.success('Subscription status updated.');
                                    }}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl font-bold"
                                >
                                    {t('monetization.refresh_access')}
                                </Button>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 dark:text-gray-500">
                                <ShieldCheck size={14} className="text-green-500" />
                                {t('monetization.secure_checkout')}
                            </div>
                            <div className="flex gap-3 grayscale opacity-30">
                                {/* Imagine card brand icons here */}
                                <div className="w-6 h-4 bg-white/10 rounded"></div>
                                <div className="w-6 h-4 bg-white/10 rounded"></div>
                                <div className="w-6 h-4 bg-white/10 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
