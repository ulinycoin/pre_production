import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/kv';

const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

const isValidEmail = (value: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);

const escapeMarkdown = (value: string) =>
  value.replace(/[_*\\[\\]()~`>#+\\-=|{}.!]/g, '\\\\$&');

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rating, comment, email, supportId, tool } = req.body;

    if (kv) {
        const ip = req.headers['x-forwarded-for'] || 'anonymous';
        const limitKey = `ratelimit:feedback:${ip}`;
        const currentRequests = await kv.get<number>(limitKey) || 0;

        if (currentRequests >= 5) {
            return res.status(429).json({ error: 'Too many feedback attempts. Please try again later.' });
        }

        await kv.set(limitKey, currentRequests + 1, { ex: 3600 });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (comment && typeof comment !== 'string') {
        return res.status(400).json({ error: 'Comment must be a string' });
    }
    if (email && (typeof email !== 'string' || !isValidEmail(email))) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!supportId || typeof supportId !== 'string' || supportId.length > 64) {
        return res.status(400).json({ error: 'Invalid support ID' });
    }
    if (tool && (typeof tool !== 'string' || tool.length > 64)) {
        return res.status(400).json({ error: 'Invalid tool value' });
    }

    const safeComment = escapeMarkdown(comment || 'No comment').slice(0, 2000);
    const safeEmail = escapeMarkdown(email || 'Anonymous').slice(0, 256);
    const safeTool = escapeMarkdown(tool || 'N/A').slice(0, 64);
    const safeSupportId = escapeMarkdown(supportId).slice(0, 64);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error('Missing Telegram configuration');
        return res.status(500).json({ error: 'Feedback system not configured' });
    }

    const emojiRating = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'][parsedRating - 1] || parsedRating;

    const message = `
🌟 *New Feedback Received*

*Rating:* ${emojiRating}
*Tool:* ${safeTool}
*Comment:* ${safeComment}
*Email:* ${safeEmail}
*Support ID:* \`${safeSupportId}\`
  `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.description || 'Telegram API error');
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error sending feedback to Telegram:', error);
        return res.status(500).json({ error: 'Failed to send feedback' });
    }
}
