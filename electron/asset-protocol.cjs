const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
};

function resolveAssetPath(distRoot, requestUrl) {
  const url = new URL(requestUrl);
  if (url.protocol !== 'ctphish:' || url.host !== 'app' || url.username || url.password) return null;
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  if (pathname.includes('\0') || pathname.includes('\\')) return null;
  const root = path.resolve(distRoot);
  const filePath = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, filePath);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return filePath;
}

function parseByteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

function createAssetHandler(distRoot) {
  return async function handleAsset(request) {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      const filePath = resolveAssetPath(distRoot, request.url);
      if (!filePath) return new Response(null, { status: 404 });
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) return new Response(null, { status: 404 });
      const headers = new Headers({
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
      });
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
      const rangeHeader = new Headers(request.headers).get('range');
      const range = rangeHeader ? parseByteRange(rangeHeader, stat.size) : undefined;
      if (rangeHeader && !range) {
        headers.set('Content-Range', `bytes */${stat.size}`);
        headers.set('Content-Length', '0');
        return new Response(null, { status: 416, headers });
      }
      if (stat.size === 0) return new Response(null, { status: 200, headers });
      const start = range ? range.start : 0;
      const end = range ? range.end : stat.size - 1;
      if (range) {
        headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        headers.set('Content-Length', String(end - start + 1));
      }
      const stream = fs.createReadStream(filePath, { start, end, highWaterMark: 64 * 1024 });
      if (request.signal) {
        const abort = () => stream.destroy();
        if (request.signal.aborted) abort();
        else request.signal.addEventListener('abort', abort, { once: true });
        stream.once('close', () => request.signal.removeEventListener('abort', abort));
      }
      const body = Readable.toWeb(stream, {
        strategy: { highWaterMark: 64 * 1024, size: (chunk) => chunk.byteLength },
      });
      return new Response(body, { status: range ? 206 : 200, headers });
    } catch {
      return new Response(null, { status: 404 });
    }
  };
}

module.exports = { createAssetHandler, parseByteRange, resolveAssetPath };
