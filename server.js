// SMC Indicator Data Server
// Option 3 — Auto-population of Phase 1-4 indicator settings
// Receives JSON data from Companion Web App and serves it to Pine Script indicators

const http = require('http');

// In-memory store for current session values
let sessionData = {
  lastUpdated: null,
  phase1: {},
  phase2: {},
  phase3: {}
};

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

  // Allow requests from any origin (required for TradingView and local Web App)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /data — Pine Script polls this to retrieve current session values
  if (req.method === 'GET' && req.url === '/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionData));
    return;
  }

  // POST /update — Companion Web App pushes data block here
  if (req.method === 'POST' && req.url === '/update') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        sessionData = {
          lastUpdated: new Date().toISOString(),
          phase1: parsed.phase1 || {},
          phase2: parsed.phase2 || {},
          phase3: parsed.phase3 || {}
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', lastUpdated: sessionData.lastUpdated }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
      }
    });
    return;
  }

  // GET /healthz — UptimeRobot pings this every 5 minutes to keep server awake
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'alive', lastUpdated: sessionData.lastUpdated }));
    return;
  }

  // Any other request — return 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`SMC Indicator Server running on port ${PORT}`);
});
