import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { type, value, timestamp } = req.body;
    if (!type || value === undefined || !timestamp) {
      return res.status(400).json({ error: 'Missing type, value, or timestamp' });
    }
    const entry = { type, value, timestamp, received: new Date().toISOString() };
    await kv.lpush('health_logs', JSON.stringify(entry));
    await kv.ltrim('health_logs', 0, 199);
    return res.status(200).json({ ok: true, entry });
  }

  if (req.method === 'GET') {
    const raw = await kv.lrange('health_logs', 0, -1);
    const logs = raw.map(e => typeof e === 'string' ? JSON.parse(e) : e);
    return res.status(200).json({ logs });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
