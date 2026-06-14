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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version, MCP-Session-Id');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, method, params } = req.body;
  if (method === 'initialize') {
    return res.status(200).json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'screentime', version: '1.0.0' }
      }
    });
  }
  if (method === 'notifications/initialized') return res.status(200).end();
  if (method === 'tools/list') {
    return res.status(200).json({
      jsonrpc: '2.0', id,
      result: {
        tools: [
          {
            name: 'get_screentime',
            description: "Get S's iPhone app usage logs",
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'get_location_events',
            description: "Get S's iPhone location events (e.g. leave_home, arrive_work)",
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'get_health_data',
            description: "Get S's iPhone health data (sleep and steps)",
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      }
    });
  }
  if (method === 'tools/call') {
    if (params.name === 'get_screentime') {
      const logs = await kv.lrange('screentime_logs', 0, -1);
      const formatted = logs.map(l => ({ ...l, time: toUKTime(l.time) }));
      return res.status(200).json({
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ logs: formatted }, null, 2) }]
        }
      });
    }
    if (params.name === 'get_location_events') {
      const events = await kv.lrange('location_events', 0, -1);
      const formatted = events.map(e => ({ ...e, timestamp: toUKTime(e.timestamp) }));
      return res.status(200).json({
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ events: formatted }, null, 2) }]
        }
      });
    }
    if (params.name === 'get_health_data') {
      const logs = await kv.lrange('health_logs', 0, -1);
      return res.status(200).json({
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ logs }, null, 2) }]
        }
      });
    }
  }
  return res.status(200).json({
    jsonrpc: '2.0', id,
    error: { code: -32601, message: 'Method not found' }
  });
};
