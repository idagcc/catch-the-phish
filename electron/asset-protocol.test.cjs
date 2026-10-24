const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createAssetHandler, parseByteRange, resolveAssetPath } = require('./asset-protocol.cjs');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ctphish-media-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bytes = Buffer.from(Array.from({ length: 4096 }, (_, index) => index % 256));
  await fs.writeFile(path.join(root, 'background.mp4'), bytes);
  await fs.writeFile(path.join(root, 'index.html'), '<html></html>');
  return { root, bytes, handle: createAssetHandler(root) };
}

test('streams a complete local video with its MIME type and length', async (t) => {
  const { handle, bytes } = await fixture(t);
  const response = await handle(new Request('ctphish://app/background.mp4'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.equal(response.headers.get('content-length'), String(bytes.length));
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
});

test('serves a requested byte segment as 206 for video seek and looping', async (t) => {
  const { handle, bytes } = await fixture(t);
  const response = await handle(new Request('ctphish://app/background.mp4', { headers: { Range: 'bytes=100-199' } }));
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), 'bytes 100-199/4096');
  assert.equal(response.headers.get('content-length'), '100');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(100, 200));
});

test('supports open-ended and suffix ranges and clamps a final segment', () => {
  assert.deepEqual(parseByteRange('bytes=4000-', 4096), { start: 4000, end: 4095 });
  assert.deepEqual(parseByteRange('bytes=-32', 4096), { start: 4064, end: 4095 });
  assert.deepEqual(parseByteRange('bytes=4000-9999', 4096), { start: 4000, end: 4095 });
  assert.deepEqual(parseByteRange('bytes=-9999', 4096), { start: 0, end: 4095 });
});

test('rejects invalid or unsatisfiable ranges without streaming a body', async (t) => {
  const { handle } = await fixture(t);
  for (const range of ['bytes=4096-', 'bytes=100-90', 'bytes=-0', 'bytes=0-1,5-6', 'bytes=-', 'bytes=99999999999999999-']) {
    const response = await handle(new Request('ctphish://app/background.mp4', { headers: { Range: range } }));
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */4096');
    assert.equal(await response.text(), '');
  }
});

test('HEAD returns the full resource metadata without opening a body stream', async (t) => {
  const { handle } = await fixture(t);
  const response = await handle(new Request('ctphish://app/background.mp4', { method: 'HEAD', headers: { Range: 'bytes=100-199' } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), '4096');
  assert.equal(response.body, null);
});

test('keeps encoded traversal, external hosts, and malformed URLs outside local files', async (t) => {
  const { root, handle } = await fixture(t);
  for (const url of ['ctphish://app/%2e%2e%2fsecret.txt', 'ctphish://app/..%5csecret.txt', 'ctphish://other/background.mp4', 'https://app/background.mp4', 'ctphish://app/%00secret', 'ctphish://user@app/background.mp4']) {
    assert.equal(resolveAssetPath(root, url), null, url);
    assert.equal((await handle({ url, method: 'GET', headers: new Headers() })).status, 404);
  }
  assert.equal((await handle(new Request('ctphish://app/%zz'))).status, 404);
  assert.equal((await handle(new Request('ctphish://app/missing.mp4'))).status, 404);
});

test('handles empty files and disallows mutating methods', async (t) => {
  const { root, handle } = await fixture(t);
  await fs.writeFile(path.join(root, 'empty.mp4'), '');
  const empty = await handle(new Request('ctphish://app/empty.mp4'));
  assert.equal(empty.status, 200);
  assert.equal(empty.headers.get('content-length'), '0');
  assert.equal(empty.body, null);
  const ranged = await handle(new Request('ctphish://app/empty.mp4', { headers: { Range: 'bytes=0-' } }));
  assert.equal(ranged.status, 416);
  assert.equal(ranged.headers.get('content-range'), 'bytes */0');
  const post = await handle(new Request('ctphish://app/background.mp4', { method: 'POST' }));
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
