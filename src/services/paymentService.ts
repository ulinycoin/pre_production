import ConfigService from './configService';

/**
 * PaymentService handles LemonSqueezy checkout and overlay integration.
 */
class PaymentService {
    private static isLSRunning = false;

    /**
     * Initialize LemonSqueezy Overlay
     */
    static async initOverlay(): Promise<void> {
        if (this.isLSRunning) return;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://app.lemonsqueezy.com/js/lemon.js';
            script.async = true;
            script.onload = () => {
                // @ts-ignore
                if (window.createLemonSqueezy) {
                    // @ts-ignore
                    window.createLemonSqueezy();
                }
                this.isLSRunning = true;
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Open LemonSqueezy Checkout for a specific tier
     */
    static async openCheckout(tier: 'pro' | 'lifetime'): Promise<void> {
        await this.initOverlay();

        const storeId = ConfigService.get('lsStoreId');
        const productId = tier === 'pro'
            ? ConfigService.get('lsProductIds').pro
            : ConfigService.get('lsProductIds').lifetime;

        if (!storeId || !productId) {
            console.error('LemonSqueezy configuration missing');
            return;
        }

        // LemonSqueezy URL format
        const checkoutUrl = `https://localpdf.lemonsqueezy.com/checkout/buy/${productId}?embed=1&media=0&dark=1`;

        // @ts-ignore
        if (window.LemonSqueezy) {
            // @ts-ignore
            window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
            window.open(checkoutUrl, '_blank');
        }
    }
}

export default PaymentService;
