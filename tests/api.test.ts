import { expect, it, vi, afterEach } from 'vitest';
import sharp from 'sharp';
import { handleUpload, serveImage, MAX_BYTES } from '../examples/next-app/lib/storage';
afterEach(() => vi.unstubAllEnvs());
async function bytes() { return sharp({ create: { width: 8, height: 8, channels: 3, background: '#27685a' } }).png().toBuffer(); }
function request(file?: File, endpoint = 'http://127.0.0.1:3047/api/uploads', field = 'image') {
  const form = new FormData(); if (file) form.append(field, file);
  return new Request(endpoint, { method: 'POST', body: form });
}
it('stores deterministic local paths and serves bytes', async () => {
  const file = new File([new Uint8Array(await bytes())], 'a.png', { type: 'image/png' });
  const response = await handleUpload(request(file)); expect(response.status).toBe(201);
  const result = await response.json(); expect(result.path).toMatch(/^test-images\/[a-f0-9]{64}\.png$/); expect(result.url).toBe(`/api/images/${result.path.split('/')[1]}`);
  const stored = await serveImage(result.path.split('/')[1]); expect(stored.status).toBe(200); expect(Buffer.from(await stored.arrayBuffer())).toEqual(await bytes());
  expect(await (await handleUpload(request(file))).json()).toEqual(result);
});
it('validates missing, empty, oversize, type mismatch, malformed and corrupt inputs', async () => {
  expect((await handleUpload(request())).status).toBe(400);
  expect((await handleUpload(request(new File([], 'empty.png', { type: 'image/png' })))).status).toBe(413);
  expect((await handleUpload(request(new File([new Uint8Array(MAX_BYTES + 1)], 'large.png', { type: 'image/png' })))).status).toBe(413);
  expect((await handleUpload(request(new File(['svg'], 'a.svg', { type: 'image/svg+xml' })))).status).toBe(415);
  expect((await handleUpload(request(new File(['bad'], 'a.png', { type: 'image/png' })))).status).toBe(422);
  expect((await handleUpload(request(new File([new Uint8Array(await bytes())], 'a.jpg', { type: 'image/jpeg' })))).status).toBe(415);
  expect((await handleUpload(new Request('http://localhost/api/uploads', { method: 'POST', body: 'x' }))).status).toBe(415);
  expect((await handleUpload(new Request('http://localhost/api/uploads', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body: 'invalid' }))).status).toBe(400);
});
it('supports the alternative schema and deliberate failure', async () => {
  const file = new File([new Uint8Array(await bytes())], 'a.png', { type: 'image/png' });
  expect((await handleUpload(request(file, 'http://localhost/api/uploads?fail=1'))).status).toBe(503);
  const result = await (await handleUpload(request(file, 'http://localhost/api/alternative', 'asset'), true)).json(); expect(result.asset.key).toMatch(/^test-images\//);
});
it('rejects cross-origin requests, unsafe identifiers, missing files and production use', async () => {
  const req = request(); req.headers.set('origin', 'https://other.invalid'); expect((await handleUpload(req)).status).toBe(403);
  expect((await serveImage('../secrets')).status).toBe(400); expect((await serveImage(`${'0'.repeat(64)}.png`)).status).toBe(404);
  vi.stubEnv('NODE_ENV', 'production'); expect((await handleUpload(request())).status).toBe(404); expect((await serveImage(`${'0'.repeat(64)}.png`)).status).toBe(404);
});
it('bounds bodies without Content-Length and rejects duplicate files', async () => {
  const oversized = new Request('http://localhost/api/uploads', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body: new Uint8Array(MAX_BYTES + 65537) });
  expect(oversized.headers.has('content-length')).toBe(false);
  expect((await handleUpload(oversized)).status).toBe(413);
  const form = new FormData();
  const file = new File([new Uint8Array(await bytes())], 'a.png', { type: 'image/png' });
  form.append('image', file); form.append('image', file);
  expect((await handleUpload(new Request('http://localhost/api/uploads', { method: 'POST', body: form }))).status).toBe(400);
});
it('ignores an uploaded filename when choosing a stored canonical path', async () => {
  const result = await (await handleUpload(request(new File([new Uint8Array(await bytes())], '../../unsafe.png', { type: 'image/png' })))).json();
  expect(result.path).toMatch(/^test-images\/[a-f0-9]{64}\.png$/);
  expect(result.path).not.toContain('unsafe');
});
