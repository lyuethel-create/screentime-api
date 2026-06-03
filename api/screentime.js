let logs = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { app, action } = req.query;

  if (app && action) {
    const entry = {
      app,
      action,
      time: new Date().toISOString()
    };
    logs.push(entry);
    // keep only last 200 entries
    if (logs.length > 200) logs = logs.slice(-200);
    return res.status(200).json({ ok: true, entry });
  }

  // no params = return all logs
  return res.status(200).json({ logs });
}
