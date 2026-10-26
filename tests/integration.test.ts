import { expect, it } from 'vitest';
import sharp from 'sharp';
import { createUploader, normalizeImage, type UploadTransport } from 'react_free_upload-core';
import { handleUpload, serveImage } from '../examples/next-app/lib/storage';
const photo = async (background: string) => new File([new Uint8Array(await sharp({ create: { width: 12, height: 12, channels: 3, background } }).png().toBuffer())], 'test.png', { type: 'image/png' });
it('runs new upload, replacement, rollback and retry against the real local API handler', async () => {
  let fail = false;
  const receipts: {previousPath:string;newPath:string}[] = [];
  const transport: UploadTransport = async file => {
    const body = new FormData(); body.append('image', file);
    const response = await handleUpload(new Request(`http://127.0.0.1:3047/api/uploads?fail=${Number(fail)}`, { method: 'POST', body }));
    const payload = await response.json(); if (!response.ok) throw Error(payload.error);
    return normalizeImage(payload);
  };
  const engine = createUploader({ transport, onReplace: result => receipts.push(result) });
  const first = await engine.upload(await photo('#225544')); expect(first?.path).toMatch(/^test-images\//);
  fail = true; await engine.upload(await photo('#bb6644')); expect(engine.getSnapshot().result).toEqual(first); expect(receipts).toHaveLength(0);
  fail = false; const second = await engine.retry(); expect(second?.path).not.toBe(first?.path);
  expect(receipts).toEqual([{ previousPath: first!.path, newPath: second!.path, newUrl: second!.url, newImageId: second!.imageId }]);
  expect((await serveImage(first!.path.split('/')[1]!)).status).toBe(200);
});
