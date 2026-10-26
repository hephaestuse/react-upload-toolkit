import { describe, it, expect, vi } from 'vitest';
import { createUploader, normalizeImage, validateFile, type UploadTransport, type UploadedImage } from 'react_free_upload-core';
const file = () => new File(['bytes'], 'photo.png', { type: 'image/png' });
const old: UploadedImage = { path: 'stored/old', url: '/visible/old.png' };
const next: UploadedImage = { path: 'stored/new', url: '/visible/new.png', imageId: '42' };
function deferred() { let resolve!: (image: UploadedImage) => void; const transport: UploadTransport = vi.fn(() => new Promise<UploadedImage>(r => { resolve = r; })); return { transport, resolve: (v = next) => resolve(v) }; }
describe('upload lifecycle', () => {
  it('normalizes an upload and invokes each callback exactly once', async () => {
    const complete = vi.fn(), change = vi.fn(), replace = vi.fn();
    const uploader = createUploader({ transport: async () => next, onUploadComplete: complete, onChange: change, onReplace: replace });
    expect(await uploader.upload(file())).toEqual(next);
    expect(uploader.getSnapshot().result).toEqual(next);
    expect(complete).toHaveBeenCalledExactlyOnceWith(next); expect(change).toHaveBeenCalledExactlyOnceWith(next); expect(replace).not.toHaveBeenCalled();
  });
  it('retains the displayed image while pending and emits both canonical paths', async () => {
    const d = deferred(), replace = vi.fn();
    const uploader = createUploader({ transport: d.transport, defaultValue: old, onReplace: replace });
    const task = uploader.upload(file());
    expect(uploader.getSnapshot().result).toEqual(old); d.resolve(); await task;
    expect(replace).toHaveBeenCalledExactlyOnceWith({ previousPath: old.path, newPath: next.path, newUrl: next.url, newImageId: '42' });
    expect(uploader.getSnapshot().result).toEqual(next);
  });
  it('rolls back failure and retries the same file using updated options', async () => {
    const replace = vi.fn();
    const uploader = createUploader({ defaultValue: old, onReplace: replace, transport: async () => { throw new Error('Offline'); } });
    await uploader.upload(file()); expect(uploader.getSnapshot()).toMatchObject({ result: old, status: 'error', canRetry: true }); expect(replace).not.toHaveBeenCalled();
    uploader.configure({ transport: async () => next, onReplace: replace }); await uploader.retry();
    expect(uploader.getSnapshot().result).toEqual(next); expect(replace).toHaveBeenCalledTimes(1);
  });
  it('cancels and ignores late completion even if a custom transport ignores abort', async () => {
    const d = deferred(), callback = vi.fn();
    const uploader = createUploader({ transport: d.transport, defaultValue: old, onReplace: callback, onUploadComplete: callback });
    const task = uploader.upload(file()); uploader.cancel(); d.resolve(); await task;
    expect(uploader.getSnapshot()).toMatchObject({ status: 'cancelled', result: old }); expect(callback).not.toHaveBeenCalled();
  });
  it('rejects stale completions after an external controlled value change', async () => {
    const d = deferred(), callback = vi.fn(); const uploader = createUploader({ transport: d.transport, value: old, onReplace: callback });
    const task = uploader.upload(file()); uploader.setValue({ path: 'external' }); d.resolve(); await task;
    expect(uploader.getSnapshot().result?.path).toBe('external'); expect(callback).not.toHaveBeenCalled();
  });
  it('keeps controlled values authoritative until the parent accepts onChange', async () => {
    const change = vi.fn(); const uploader = createUploader({ transport: async () => next, value: old, onChange: change });
    await uploader.upload(file()); expect(uploader.getSnapshot().result).toEqual(old); expect(change).toHaveBeenCalledWith(next);
    uploader.setValue(next); expect(uploader.getSnapshot().result).toEqual(next);
  });
  it('supports custom transports and clamps computable progress below completion', async () => {
    let progress: number | null = null;
    const uploader = createUploader({ transport: async (_file, ctx) => { ctx.onProgress({ loaded: 200, total: 100 }); progress = uploader.getSnapshot().progress; return next; } });
    await uploader.upload(file()); expect(progress).toBe(99); expect(uploader.getSnapshot().progress).toBe(100);
  });
  it('newer uploads supersede older uploads', async () => {
    const a = deferred(), b = deferred(), complete = vi.fn(); const uploader = createUploader({ transport: a.transport, onUploadComplete: complete });
    const first = uploader.upload(file()); uploader.configure({ transport: b.transport, onUploadComplete: complete }); const second = uploader.upload(file());
    b.resolve(next); await second; a.resolve(old); await first; expect(uploader.getSnapshot().result).toEqual(next); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('does not turn callback exceptions into upload failures', async () => {
    const callbackError = vi.fn(); const uploader = createUploader({ transport: async () => next, onUploadComplete: () => { throw Error('consumer bug'); }, onCallbackError: callbackError });
    await uploader.upload(file()); expect(uploader.getSnapshot().status).toBe('success'); expect(callbackError).toHaveBeenCalledTimes(1);
  });
});
describe('validation', () => {
  it('rejects empty, oversized and unaccepted files without transport calls', async () => {
    const transport = vi.fn(); const uploader = createUploader({ transport, maxBytes: 2 });
    await uploader.upload(file()); expect(transport).not.toHaveBeenCalled(); expect(uploader.getSnapshot().status).toBe('error');
    expect(() => validateFile(new File([], 'x.png', { type: 'image/png' }))).toThrow();
    expect(() => validateFile(new File(['x'], 'x.svg', { type: 'image/svg+xml' }))).toThrow();
    expect(() => validateFile(file(), { acceptedTypes: ['image/*'] })).not.toThrow();
  });
  it('requires a real path and never derives one from a URL or filename', () => {
    expect(() => normalizeImage({ url: '/file.png' })).toThrow(/canonical path/);
    expect(() => normalizeImage({ path: ' ' })).toThrow();
    expect(() => normalizeImage({ path: 'ok', url: 10 })).toThrow();
  });
});
