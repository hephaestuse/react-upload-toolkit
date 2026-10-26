import { expect, it, vi } from 'vitest';
import { createUploader, type UploadedImage } from 'react_free_upload-core';
it('explicit controlled null overrides defaultValue', () => {
  expect(createUploader({ value: null, defaultValue: { path: 'ignored' }, transport: async () => ({ path: 'x' }) }).getSnapshot().result).toBeNull();
});
it('failed validation preserves previous image and emits onError only', async () => {
  const onError = vi.fn(), onReplace = vi.fn(), onUploadComplete = vi.fn();
  const engine = createUploader({ defaultValue: { path: 'old' }, transport: vi.fn(), onError, onReplace, onUploadComplete });
  await engine.upload(new File(['bad'], 'bad.svg', { type: 'image/svg+xml' }));
  expect(engine.getSnapshot().result?.path).toBe('old'); expect(onError).toHaveBeenCalledTimes(1); expect(onReplace).not.toHaveBeenCalled(); expect(onUploadComplete).not.toHaveBeenCalled();
});
it('dispose ignores progress and completion from an obsolete transport', async () => {
  let done!: (image: UploadedImage) => void, progress!: (p: {loaded:number;total:number})=>void;
  const callback = vi.fn();
  const engine = createUploader({ transport: (_file, ctx) => { progress = ctx.onProgress; return new Promise(r => { done = r; }); }, onUploadComplete: callback });
  const task = engine.upload(new File(['x'], 'x.png', { type: 'image/png' })); engine.dispose(); progress({loaded:1,total:1}); done({ path: 'late' }); await task;
  expect(engine.getSnapshot().result).toBeNull(); expect(callback).not.toHaveBeenCalled();
});
it('ignores progress delivered after an operation has already settled', async () => {
  let progress!: (p: { loaded: number; total: number }) => void;
  const engine = createUploader({ transport: async (_file, ctx) => { progress = ctx.onProgress; return { path: 'complete' }; } });
  await engine.upload(new File(['x'], 'x.png', { type: 'image/png' }));
  progress({ loaded: 1, total: 4 });
  expect(engine.getSnapshot()).toMatchObject({ status: 'success', progress: 100 });
  engine.configure({ transport: async (_file, ctx) => { progress = ctx.onProgress; throw Error('offline'); } });
  await engine.upload(new File(['x'], 'x.png', { type: 'image/png' }));
  progress({ loaded: 1, total: 4 });
  expect(engine.getSnapshot()).toMatchObject({ status: 'error', progress: null });
});
it('clearing an existing image before the first upload returns to idle', () => {
  const engine = createUploader({ defaultValue: { path: 'initial' }, transport: async () => ({ path: 'next' }) });
  engine.setValue(null);
  expect(engine.getSnapshot()).toMatchObject({ status: 'idle', result: null, replacement: null });
});
