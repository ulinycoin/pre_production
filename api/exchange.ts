import { VercelRequest, VercelResponse } from '@vercel/node';
import * as jose from 'jose';

/**
 * Exchange a LemonSqueezy license key for a signed JWT token.
 * This function should be deployed to Vercel/Netlify.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { licenseKey, tier } = req.body;

    if (!licenseKey) {
        return res.status(400).json({ error: 'License key is required' });
    }

    const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
    const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;

    if (!LEMON_SQUEEZY_API_KEY || !JWT_PRIVATE_KEY) {
        console.error('Server configuration error: Missing API Key or Private Key');
        return res.status(500).json({ error: 'Internal server error' });
    }

    try {
        // 1. Validate license key with LemonSqueezy
        // https://docs.lemonsqueezy.com/help/licensing/license-api#validate-a-license-key
        const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                license_key: licenseKey,
            }),
        });

        const lsData = await lsResponse.json();

        if (!lsResponse.ok || !lsData.valid) {
            return res.status(401).json({
                error: 'Invalid license key',
                details: lsData.error || 'The license key provided is not valid.'
            });
        }

        // 2. Identify the tier based on the product/variant in LS data
        // For simplicity, we trust the tier passed if valid, or derive from lsData
        const productTier = tier || (lsData.meta?.variant_name?.toLowerCase().includes('lifetime') ? 'lifetime' : 'pro');

        // 3. Generate signed JWT using RS256
        const privateKey = await jose.importPKCS8(JWT_PRIVATE_KEY, 'RS256');

        const token = await new jose.SignJWT({
            tier: productTier,
            license_key: licenseKey,
            instance_id: lsData.license_key?.id
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuedAt()
            .setIssuer('localpdf:auth')
            .setAudience('localpdf:app')
            .setExpirationTime('30d') // User needs to re-verify every 30 days
            .sign(privateKey);

        return res.status(200).json({
            success: true,
            token,
            tier: productTier,
            expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        });

    } catch (error) {
        console.error('Exchange error:', error);
        return res.status(500).json({ error: 'Failed to verify license' });
    }
}
