import monetizationConfig from '../config/monetization.json';

export type MonetizationTier = 'free' | 'pro' | 'lifetime';

interface Config {
    isDev: boolean;
    productionUrl: string;
    jwtPublicKey: string | null;
    lsStoreId: string | null;
    lsProductIds: {
        pro: string | null;
        lifetime: string | null;
    };
}

class ConfigService {
    private static config: Config = {
        isDev: import.meta.env.DEV,
        productionUrl: import.meta.env.VITE_PRODUCTION_URL || 'https://localpdf.online',
        jwtPublicKey: import.meta.env.VITE_PUBLIC_JWT_KEY || null,
        lsStoreId: import.meta.env.VITE_LS_STORE_ID || import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || null,
        lsProductIds: {
            pro: import.meta.env.VITE_LS_PRODUCT_ID_PRO_SUB || import.meta.env.VITE_LEMONSQUEEZY_MONTHLY_PRODUCT_ID || null,
            lifetime: import.meta.env.VITE_LS_PRODUCT_ID_PRO_LIFETIME || import.meta.env.VITE_LEMONSQUEEZY_LIFETIME_PRODUCT_ID || null,
        },
    };

    /**
     * Get an environment variable with optional fallback
     */
    static get<T extends keyof Config>(key: T): Config[T] {
        return this.config[key];
    }

    /**
     * Get non-sensitive monetization tier info
     */
    static getTierInfo(tier: MonetizationTier) {
        return monetizationConfig.tiers[tier];
    }

    /**
     * Check if monetization is fully configured (for dev warnings)
     */
    static isMonetizationReady(): boolean {
        return (
            !!this.config.jwtPublicKey &&
            !!this.config.lsStoreId &&
            !!this.config.lsProductIds.pro
        );
    }

    /**
     * Returns JWT Public Key as JWK or null
     */
    static getJwtPublicKey(): any | null {
        if (!this.config.jwtPublicKey) return null;
        try {
            return JSON.parse(this.config.jwtPublicKey);
        } catch (e) {
            console.error('Invalid JWT Public Key format in environment');
            return null;
        }
    }
}

export default ConfigService;
