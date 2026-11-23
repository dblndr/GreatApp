"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".css": "text/css; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

function serve(root) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(base, rel);
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403); res.end("no"); return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); res.end("no"); return; }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, url: "http://127.0.0.1:" + server.address().port });
    });
  });
}

module.exports = { serve };
