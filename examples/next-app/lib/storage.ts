import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
// Fixed fixture directory; no environment storage configuration or credentials.
const root = join(dirname(fileURLToPath(import.meta.url)), '../.dev-storage');
export const MAX_BYTES = 5 * 1024 * 1024;
const types = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' } as const;
export const fixtureEnabled = () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const error = (message: string, status: number) => Response.json({ error: message }, { status });

export async function handleUpload(request: Request, alternative = false) {
  if (!fixtureEnabled()) return error('Development fixture is disabled.', 404);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return error('Cross-origin upload rejected.', 403);
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return error('Expected multipart form data.', 415);
  const length = Number(request.headers.get('content-length'));
  if (length > MAX_BYTES + 65536) return error('Request is too large.', 413);
  // Bound the complete multipart stream, including requests without Content-Length.
  if (!request.body) return error('Missing request body.', 400);
  const chunks: Uint8Array[] = [];
  const reader = request.body.getReader();
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES + 65536) { await reader.cancel(); return error('Request is too large.', 413); }
      chunks.push(value);
    }
  } catch { return error('Could not read request body.', 400); }
  let form: FormData;
  try { form = await new Request(request.url, { method: 'POST', headers: { 'content-type': request.headers.get('content-type')! }, body: Buffer.concat(chunks) }).formData(); }
  catch { return error('Malformed multipart body.', 400); }
  const field = alternative ? 'asset' : 'image';
  const files = form.getAll(field);
  if (files.length !== 1 || !(files[0] instanceof File)) return error(`Supply exactly one ${field} file.`, 400);
  const file = files[0];
  if (!file.size || file.size > MAX_BYTES) return error('Image must be between 1 byte and 5 MiB.', 413);
  if (!Object.values(types).includes(file.type as typeof types[keyof typeof types])) return error('Use PNG, JPEG, or WebP.', 415);
  const bytes = Buffer.from(await file.arrayBuffer());
  let format: keyof typeof types;
  try {
    const image = sharp(bytes, { failOn: 'error', limitInputPixels: 16_000_000 });
    const meta = await image.metadata();
    if (!meta.format || !(meta.format in types)) return error('Unsupported image bytes.', 415);
    format = meta.format as keyof typeof types;
    if (types[format] !== file.type) return error('File type does not match its contents.', 415);
    if (!meta.width || !meta.height || meta.width > 8000 || meta.height > 8000 || (meta.pages ?? 1) > 1) return error('Image dimensions or animation are not supported.', 422);
    await image.stats(); // Decode pixels too: metadata alone may accept truncated data.
  } catch { return error('Image is corrupt or exceeds the pixel limit.', 422); }
  const mode = new URL(request.url).searchParams;
  if (mode.get('fail') === '1') return error('Simulated upload failure. Turn off failure mode and retry.', 503);
  if (mode.get('slow') === '1') await new Promise(resolve => setTimeout(resolve, 2000));
  const imageId = createHash('sha256').update(bytes).digest('hex');
  const name = `${imageId}.${format === 'jpeg' ? 'jpg' : format}`;
  try {
    await mkdir(root, { recursive: true });
    await writeFile(join(root, name), bytes);
  } catch { return error('Local fixture storage is unavailable.', 500); }
  const path = `test-images/${name}`;
  const url = `/api/images/${name}`;
  return Response.json(alternative ? { asset: { key: path, preview: url, id: imageId } } : { path, url, imageId }, { status: 201 });
}
export async function serveImage(name: string) {
  if (!fixtureEnabled()) return error('Development fixture is disabled.', 404);
  if (!/^[a-f0-9]{64}\.(png|jpg|webp)$/.test(name)) return error('Invalid image identifier.', 400);
  try {
    const bytes = await readFile(join(root, name));
    return new Response(bytes, { headers: { 'Content-Type': name.endsWith('.png') ? 'image/png' : name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (cause) { return error((cause as NodeJS.ErrnoException).code === 'ENOENT' ? 'Image not found.' : 'Could not read image.', (cause as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500); }
}
