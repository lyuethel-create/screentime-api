const { kv } = require('@vercel/kv');

function toUKTime(isoString) {
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') {
    const { type, timestamp } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const entry = { type, timestamp: timestamp || new Date().toISOString() };
    await kv.lpush('location_events', entry);
    await kv.ltrim('location_events', 0, 199);
    return res.status(200).json({ ok: true, entry });
  }
  if (req.method === 'GET') {
    const events = await kv.lrange('location_events', 0, -1);
    const formatted = events.map(e => ({ ...e, timestamp: toUKTime(e.timestamp) }));
    return res.status(200).json({ events: formatted });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
