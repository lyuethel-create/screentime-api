import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { app, action } = req.query;

  if (app && action) {
    const entry = {
      app,
      action,
      time: new Date().toISOString()
    };
    await redis.lpush('screentime_logs', JSON.stringify(entry));
    await redis.ltrim('screentime_logs', 0, 199);
    return res.status(200).json({ ok: true, entry });
  }

  const raw = await redis.lrange('screentime_logs', 0, -1);
  const logs = raw.map(e => JSON.parse(e));
  return res.status(200).json({ logs });
}
