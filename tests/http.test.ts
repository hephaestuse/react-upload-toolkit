// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { createHttpTransport } from 'react_free_upload-core';
class Xhr {
  static last: Xhr;
  constructor() { Xhr.last = this; }
  status = 201; response: unknown = { path: 'canonical', url: '/show' }; timeout = 0; withCredentials = false; responseType = '';
  upload = { onprogress: null as null | ((e: object) => void) };
  onload: (() => void) | null = null; onerror: (() => void) | null = null; onabort: (() => void) | null = null; ontimeout: (() => void) | null = null;
  open = vi.fn(); setRequestHeader = vi.fn(); send = vi.fn(); abort = vi.fn(() => this.onabort?.());
}
afterEach(() => vi.unstubAllGlobals());
function start(options = {}) {
  vi.stubGlobal('XMLHttpRequest', Xhr); const controller = new AbortController(); const progress = vi.fn();
  const promise = createHttpTransport({ endpoint: '/local', ...options })(new File(['x'], 'x.png', { type: 'image/png' }), { signal: controller.signal, onProgress: progress });
  return { promise, xhr: Xhr.last, controller, progress };
}
it('sends multipart and maps a custom response with progress', async () => {
  const { promise, xhr, progress } = start({ fieldName: 'asset', withCredentials: true, mapResponse: () => ({ path: 'mapped' }) });
  expect(xhr.send.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
  expect((xhr.send.mock.calls[0]?.[0] as FormData).has('asset')).toBe(true);
  xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 }); expect(progress).toHaveBeenCalledWith({ loaded: 5, total: 10 });
  xhr.onload?.(); await expect(promise).resolves.toEqual({ path: 'mapped' }); expect(xhr.withCredentials).toBe(true);
});
it('reports HTTP errors and malformed successful responses', async () => {
  const a = start(); a.xhr.status = 413; a.xhr.response = { error: 'Too big' }; a.xhr.onload?.(); await expect(a.promise).rejects.toMatchObject({ message: 'Too big', status: 413 });
  const b = start(); b.xhr.response = { url: '/no-path' }; b.xhr.onload?.(); await expect(b.promise).rejects.toThrow(/canonical path/);
});
it('handles network, timeout, cancellation and pre-aborted signals', async () => {
  const a = start(); a.xhr.onerror?.(); await expect(a.promise).rejects.toMatchObject({ code: 'network' });
  const b = start(); b.xhr.ontimeout?.(); await expect(b.promise).rejects.toMatchObject({ code: 'timeout' });
  const c = start(); c.controller.abort(); await expect(c.promise).rejects.toMatchObject({ name: 'AbortError' });
  await expect(createHttpTransport({ endpoint: '/local' })(new File(['x'], 'x'), { signal: AbortSignal.abort(), onProgress: vi.fn() })).rejects.toMatchObject({ name: 'AbortError' });
});
