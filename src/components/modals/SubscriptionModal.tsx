import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import ConfigService from '@/services/configService';
import { Check, Zap, Rocket, Infinity as InfinityIcon, ShieldCheck, Loader2 } from 'lucide-react';
import PaymentService from '@/services/paymentService';
import SubscriptionService from '@/services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'plans' | 'restore'>('plans');
    const [licenseKey, setLicenseKey] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    const proInfo = ConfigService.getTierInfo('pro');
    const lifetimeInfo = ConfigService.getTierInfo('lifetime');

    const handlePurchase = async (tier: 'pro' | 'lifetime') => {
        try {
            await PaymentService.openCheckout(tier);
        } catch (e) {
            console.error('Purchase failed:', e);
            toast.error('Failed to open checkout. Please try again.');
        }
    };

    const handleRestore = async () => {
        if (!licenseKey) return;
        setIsRestoring(true);
        try {
            const success = await SubscriptionService.saveToken(licenseKey); // License key acts as initial token for exchange
            if (success) {
                toast.success('Subscription restored successfully!');
                onClose();
            } else {
                toast.error('Invalid license key or subscription expired.');
            }
        } catch (e) {
            console.error('Restore failed:', e);
            toast.error('Restoration failed. Please check your connection.');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-[#18181b] border-white/10 shadow-2xl">
                <div className="card-glass pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row h-full">
                    {/* Left Side: Illustration / Benefits */}
                    <div className="md:w-1/4 bg-accent-blue/5 p-8 border-r border-white/5 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30 text-[10px] font-bold uppercase tracking-wider">
                                <Zap size={10} /> LocalPDF PRO
                            </div>
                            <h2 className="text-2xl font-bold text-white font-outfit">
                                {t('monetization.upgrade_now')}
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    t('monetization.features.no_limits'),
                                    t('monetization.features.batch'),
                                    t('monetization.features.tier3'),
                                    t('monetization.features.support')
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                        <Check size={16} className="text-accent-blue mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-8">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight font-bold">
                                    Privacy Sanctuary
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
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
                                className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'plans' ? 'text-white border-accent-blue' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                {t('monetization.choose_plan')}
                            </button>
                            <button
                                onClick={() => setActiveTab('restore')}
                                className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'restore' ? 'text-white border-accent-blue' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                {t('monetization.restore')}
                            </button>
                        </div>

                        {activeTab === 'plans' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Free Plan */}
                                <div className="group relative p-6 rounded-[2rem] bg-white/5 border border-white/10 transition-all flex flex-col">
                                    <h3 className="text-md font-bold text-white mb-1">{t('monetization.free.name')}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-xl font-bold text-white">${t('monetization.free.price')}</span>
                                        <span className="text-[10px] text-gray-500">/{t('monetization.free.interval')}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-6 flex-1">
                                        {t('monetization.free.description')}
                                    </p>
                                    <Button
                                        disabled
                                        className="w-full rounded-xl bg-white/5 text-gray-500 font-bold cursor-default"
                                    >
                                        {t('monetization.free.cta')}
                                    </Button>
                                </div>

                                {/* Pro Monthly */}
                                <div className="group relative p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-accent-blue/50 transition-all hover:scale-[1.02] flex flex-col shadow-xl hover:shadow-accent-blue/5">
                                    <div className="absolute top-4 right-4 text-accent-blue opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Rocket size={18} />
                                    </div>
                                    <h3 className="text-md font-bold text-white mb-1">PRO Monthly</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-xl font-bold text-white">${proInfo.price}</span>
                                        <span className="text-[10px] text-gray-500">/{proInfo.interval}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-6 flex-1">
                                        {t('monetization.features.unlimited')}
                                    </p>
                                    <Button
                                        onClick={() => handlePurchase('pro')}
                                        className="w-full rounded-xl bg-white/10 hover:bg-accent-blue text-white transition-all font-bold"
                                    >
                                        {t('monetization.pro.cta')}
                                    </Button>
                                </div>

                                {/* Lifetime */}
                                <div className="group relative p-6 rounded-[2rem] bg-accent-blue text-white shadow-xl shadow-accent-blue/20 hover:scale-[1.02] transition-all overflow-hidden border border-white/20 flex flex-col">
                                    <div className="absolute top-4 right-4 text-white opacity-40">
                                        <InfinityIcon size={20} />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className="text-md font-bold mb-1">Lifetime PRO</h3>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-xl font-bold">${lifetimeInfo.price}</span>
                                            <span className="text-[10px] opacity-70">once</span>
                                        </div>
                                        <p className="text-xs opacity-80 mb-6 flex-1">
                                            {t('monetization.features.unlimited')}
                                        </p>
                                        <Button
                                            onClick={() => handlePurchase('lifetime')}
                                            className="w-full rounded-xl bg-white text-accent-blue hover:bg-ocean-50 font-bold transition-all shadow-lg mt-auto"
                                        >
                                            {t('monetization.lifetime.cta')}
                                        </Button>
                                    </div>
                                    {/* Decorative shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {t('monetization.restore_hint')}
                                    </label>
                                    <input
                                        type="text"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                        placeholder="LS-XXXX-XXXX-XXXX-XXXX"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-accent-blue transition-all"
                                    />
                                </div>
                                <Button
                                    onClick={handleRestore}
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
                        )}

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
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
