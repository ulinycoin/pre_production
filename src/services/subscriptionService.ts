import * as jose from 'jose';
import ConfigService from './configService';
import StorageService from './storageService';

export interface SubscriptionInfo {
    status: 'free' | 'pro' | 'lifetime';
    expiresAt: number | null;
    token: string | null;
}

class SubscriptionService {
    /**
     * Check current subscription status from stored token
     */
    static async checkSubscription(): Promise<SubscriptionInfo> {
        const token = await StorageService.getToken();

        if (!token) {
            return { status: 'free', expiresAt: null, token: null };
        }

        const validation = await this.verifyToken(token);

        if (!validation.isValid) {
            await StorageService.clearToken();
            return { status: 'free', expiresAt: null, token: null };
        }

        return {
            status: validation.payload?.tier as any || 'pro',
            expiresAt: validation.payload?.exp || null,
            token
        };
    }

    /**
     * Verify token signature and expiry using jose
     */
    static async verifyToken(token: string): Promise<{ isValid: boolean; payload?: any }> {
        const jwk = ConfigService.getJwtPublicKey();

        if (!jwk) {
            console.warn('Subscription verify skipped: No Public Key found in environment.');
            return { isValid: false };
        }

        try {
            const publicKey = await jose.importJWK(jwk, 'RS256');
            const { payload } = await jose.jwtVerify(token, publicKey, {
                issuer: 'localpdf:auth',
                audience: 'localpdf:app',
            });

            return { isValid: true, payload };
        } catch (e) {
            console.error('Subscription token verification failed:', e);
            return { isValid: false };
        }
    }

    /**
     * Save new token (e.g. after restoration or purchase)
     * If the input is a license key, it attempts to exchange it for a JWT.
     */
    static async saveToken(tokenOrKey: string): Promise<boolean> {
        let licenseKey: string | null = null;
        // Simple heuristic: if it looks like a license key (LS-...), exchange it
        if (tokenOrKey.startsWith('LS-') || (tokenOrKey.length < 50 && tokenOrKey.includes('-'))) {
            licenseKey = tokenOrKey;
            try {
                const response = await fetch('/api/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ licenseKey: tokenOrKey }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.token) {
                        tokenOrKey = data.token; // Use the returned JWT
                    }
                } else {
                    console.error('License exchange failed');
                    return false;
                }
            } catch (e) {
                console.error('Network error during exchange:', e);
                return false;
            }
        }

        const validation = await this.verifyToken(tokenOrKey);
        if (validation.isValid) {
            await StorageService.setToken(tokenOrKey);
            if (licenseKey) {
                await StorageService.setLicenseKey(licenseKey);
            }
            return true;
        }
        return false;
    }

    /**
     * Re-exchanges a stored license key for a new JWT
     */
    static async reExchange(): Promise<boolean> {
        const key = await StorageService.getLicenseKey();
        if (!key) return false;

        try {
            const response = await fetch('/api/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey: key }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    const validation = await this.verifyToken(data.token);
                    if (validation.isValid) {
                        await StorageService.setToken(data.token);
                        return true;
                    }
                }
            }
        } catch (e) {
            console.error('Re-exchange failed:', e);
        }
        return false;
    }
}

export default SubscriptionService;
