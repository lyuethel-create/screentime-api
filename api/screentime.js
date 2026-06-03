import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { app, action } = req.query;

  if (app && action) {
    const entry = {
      app,
      action,
      time: new Date().toISOString()
    };
    await kv.lpush('screentime_logs', JSON.stringify(entry));
    await kv.ltrim('screentime_logs', 0, 199);
    return res.status(200).json({ ok: true, entry });
  }

  const raw = await kv.lrange('screentime_logs', 0, -1);
  const logs = raw.map(e => JSON.parse(e));
  return res.status(200).json({ logs });
}
