const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { app, action } = req.body;
    if (app && action) {
      const entry = { app, action, time: new Date().toISOString() };
      await kv.lpush('screentime_logs', entry);
      await kv.ltrim('screentime_logs', 0, 199);
      return res.status(200).json({ ok: true, entry });
    }
  }

  if (req.method === 'GET') {
    const { app, action } = req.query;
    if (app && action) {
      const entry = { app, action, time: new Date().toISOString() };
      await kv.lpush('screentime_logs', entry);
      await kv.ltrim('screentime_logs', 0, 199);
      return res.status(200).json({ ok: true, entry });
    }
    const logs = await kv.lrange('screentime_logs', 0, -1);
    return res.status(200).json({ logs });
  }
};
