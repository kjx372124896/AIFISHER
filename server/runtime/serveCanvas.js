import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

export function serveCanvas(app, distDirectory) {
  const root = path.resolve(distDirectory);
  const indexFile = path.join(root, 'index.html');

  app.use(express.static(root, {
    index: false,
    fallthrough: true,
    etag: true,
  }));

  app.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next();
    if (
      request.path.startsWith('/api') ||
      request.path.startsWith('/library') ||
      request.path.startsWith('/diagnostics') ||
      request.path.startsWith('/internal')
    ) return next();
    if (!fs.existsSync(indexFile)) return next();
    return response.sendFile(indexFile);
  });
}
