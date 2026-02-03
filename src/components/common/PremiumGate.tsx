import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import { ShieldAlert, Zap } from 'lucide-react';

interface PremiumGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ children, fallback }) => {
    const { isPremium, isLoading } = useSubscription();
    const { t } = useI18n();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
            </div>
        );
    }

    if (isPremium) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-8 md:p-12 text-center">
            <div className="card-glass"></div>

            <div className="relative z-10 max-w-md mx-auto space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-blue/20 text-accent-blue border border-accent-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Zap size={32} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-outfit text-white">
                        {t('monetization.premium_feature')}
                    </h3>
                    <p className="text-gray-400">
                        {t('monetization.premium_description')}
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button
                        className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-accent-blue/20"
                        onClick={() => window.location.hash = '#upgrade'}
                    >
                        {t('monetization.upgrade_now')}
                    </Button>

                    <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1.5">
                        <ShieldAlert size={12} />
                        {t('monetization.private_secure_fast')}
                    </p>
                </div>
            </div>

            {/* Background flare */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-blue/5 blur-[80px] rounded-full"></div>
        </div>
    );
};
