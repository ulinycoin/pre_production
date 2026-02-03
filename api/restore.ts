import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/kv';
import * as jose from 'jose';

const kv = createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
});

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { licenseKey, supportId } = req.body;

    if (!licenseKey || !supportId) {
        return res.status(400).json({ error: 'License key and Support ID are required' });
    }

    // Rate limiting via Vercel KV
    const ip = req.headers['x-forwarded-for'] || 'anonymous';
    const limitKey = `ratelimit:restore:${ip}`;
    const currentRequests = await kv.get<number>(limitKey) || 0;

    if (currentRequests >= 5) {
        return res.status(429).json({ error: 'Too many restoration attempts. Please try again in an hour.' });
    }

    await kv.set(limitKey, currentRequests + 1, { ex: 3600 });

    try {
        // 1. Validate license key with LemonSqueezy
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
            return res.status(401).json({ error: 'Invalid license key' });
        }

        const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
        if (!JWT_PRIVATE_KEY) throw new Error('Missing JWT_PRIVATE_KEY');

        // 2. Generate signed JWT
        const privateKey = await jose.importPKCS8(JWT_PRIVATE_KEY, 'RS256');
        const token = await new jose.SignJWT({
            tier: lsData.meta?.variant_name?.toLowerCase().includes('lifetime') ? 'lifetime' : 'pro',
            license_key: licenseKey,
            support_id: supportId
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuedAt()
            .setIssuer('localpdf:auth')
            .setAudience('localpdf:app')
            .setExpirationTime('30d')
            .sign(privateKey);

        return res.status(200).json({
            success: true,
            token,
            tier: lsData.meta?.variant_name?.toLowerCase().includes('lifetime') ? 'lifetime' : 'pro'
        });

    } catch (error) {
        console.error('Restoration error:', error);
        return res.status(500).json({ error: 'Failed to verify license' });
    }
}
