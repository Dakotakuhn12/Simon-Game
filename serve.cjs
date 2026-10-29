const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const allowed = new Set(['index.html', 'index.js', 'app.js', 'style.css', 'sw.js', 'manifest.webmanifest', 'assets/dark-geometric.png', 'assets/icon.svg', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png']);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png' };
const server = http.createServer((req, res) => {
 let file;
 try { file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html'; } catch { res.writeHead(400).end(); return; }
 if (!['GET','HEAD'].includes(req.method) || !allowed.has(file)) { res.writeHead(404).end(); return; }
 fs.readFile(path.join(root, file), (error, data) => {
  if (error) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : data);
 });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port 4173 is in use. If Simon is already running, open http://localhost:4173/ .' : error.message); process.exitCode=1; });
server.listen(4173, '127.0.0.1', () => console.log('Simon is ready: http://localhost:4173/\nOpen that address in your browser. Keep this window open while playing.\nPress Ctrl+C to stop.'));
