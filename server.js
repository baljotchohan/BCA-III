const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8192;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Polyfill Vercel-like helpers for handlers
function wrapHandler(handlerModulePath) {
  return async (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      if (body) {
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = body;
        }
      } else {
        req.body = {};
      }

      // Add Express/Vercel response helpers
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };
      res.json = function (obj) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(obj));
        return this;
      };

      try {
        delete require.cache[require.resolve(handlerModulePath)];
        const handler = require(handlerModulePath);
        await handler(req, res);
      } catch (err) {
        console.error(`API Error in ${handlerModulePath}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      }
    });
  };
}

const apiRoutes = {
  '/api/create-order': wrapHandler('./api/create-order.js'),
  '/api/verify-payment': wrapHandler('./api/verify-payment.js'),
  '/api/token': wrapHandler('./api/token.js'),
  '/api/mcp': wrapHandler('./api/mcp.js')
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Check API routes
  if (apiRoutes[pathname]) {
    apiRoutes[pathname](req, res);
    return;
  }

  // 2. Static file routing
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for HTML5 SPA navigation or 404
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 BCA III Hub Local Dev Server running on http://localhost:${PORT}`);
});
