export type UploadedImage = { path: string; url?: string; imageId?: string };
export type ImageReplaceResult = { previousPath: string; newPath: string; newUrl?: string; newImageId?: string };
export type UploadProgress = { loaded: number; total: number };
export type UploadTransport = (file: File, context: { signal: AbortSignal; onProgress: (progress: UploadProgress) => void }) => Promise<UploadedImage>;
export type FileRestrictions = { maxBytes?: number; acceptedTypes?: readonly string[] };
export const defaultRestrictions = { maxBytes: 5 * 1024 * 1024, acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] } as const;
export class UploadError extends Error {
  constructor(message: string, public code: 'validation' | 'http' | 'network' | 'response' | 'timeout' | 'upload', public status?: number) { super(message); this.name = 'UploadError'; }
}
export function validateFile(file: File, restrictions: FileRestrictions = {}): void {
  const { maxBytes = defaultRestrictions.maxBytes, acceptedTypes = defaultRestrictions.acceptedTypes } = restrictions;
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) throw new UploadError('maxBytes must be a positive finite number.', 'validation');
  if (!file.size || file.size > maxBytes) throw new UploadError(`Select a non-empty image no larger than ${maxBytes} bytes.`, 'validation');
  if (!acceptedTypes.some(type => type.endsWith('/*') ? file.type.startsWith(type.slice(0, -1)) : type === file.type)) throw new UploadError('This image type is not allowed.', 'validation');
}
export function normalizeImage(value: unknown): UploadedImage {
  if (!value || typeof value !== 'object' || !('path' in value) || typeof value.path !== 'string' || !value.path.trim()) throw new UploadError('The upload response must contain a canonical path.', 'response');
  const result: UploadedImage = { path: value.path };
  for (const key of ['url', 'imageId'] as const) {
    if (key in value) {
      const field = (value as Record<string, unknown>)[key];
      if (field !== undefined && typeof field !== 'string') throw new UploadError(`Invalid ${key} in upload response.`, 'response');
      if (typeof field === 'string') result[key] = field;
    }
  }
  return result;
}
export type HttpTransportOptions = {
  endpoint: string; fieldName?: string; method?: 'POST' | 'PUT'; headers?: Record<string, string>;
  withCredentials?: boolean; timeoutMs?: number;
  createBody?: (file: File) => XMLHttpRequestBodyInit;
  mapResponse?: (payload: unknown) => UploadedImage;
  errorMessage?: (payload: unknown, status: number) => string;
};
/** Browser XHR transport: multipart by default, with upload progress and abort. */
export function createHttpTransport(options: HttpTransportOptions): UploadTransport {
  return (file, { signal, onProgress }) => new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Upload cancelled.', 'AbortError')); return; }
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = (error?: unknown, result?: UploadedImage) => {
      signal.removeEventListener('abort', abort);
      xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = null;
      xhr.upload.onprogress = null;
      if (error) reject(error); else resolve(result!);
    };
    try {
      xhr.open(options.method ?? 'POST', options.endpoint);
      xhr.responseType = 'json';
      xhr.timeout = options.timeoutMs ?? 60_000;
      xhr.withCredentials = options.withCredentials ?? false;
      for (const [key, value] of Object.entries(options.headers ?? {})) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress({ loaded: e.loaded, total: e.total }); };
      xhr.onerror = () => finish(new UploadError('Network error. Check your connection and retry.', 'network'));
      xhr.ontimeout = () => finish(new UploadError('Upload timed out. Please retry.', 'timeout'));
      xhr.onabort = () => finish(new DOMException('Upload cancelled.', 'AbortError'));
      xhr.onload = () => {
        try {
          const payload: unknown = xhr.response;
          if (xhr.status < 200 || xhr.status >= 300) {
            const fallback = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string' ? payload.error : `Upload failed (HTTP ${xhr.status}).`;
            throw new UploadError(options.errorMessage?.(payload, xhr.status) ?? fallback, 'http', xhr.status);
          }
          finish(undefined, normalizeImage(options.mapResponse ? options.mapResponse(payload) : payload));
        } catch (error) { finish(error); }
      };
      const body = options.createBody ? options.createBody(file) : (() => { const form = new FormData(); form.append(options.fieldName ?? 'image', file); return form; })();
      if (signal.aborted) { finish(new DOMException('Upload cancelled.', 'AbortError')); return; }
      signal.addEventListener('abort', abort, { once: true });
      xhr.send(body);
    } catch (error) { finish(error); }
  });
}
export type UploadState = {
  status: 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';
  result: UploadedImage | null;
  lastUpload: UploadedImage | null;
  replacement: ImageReplaceResult | null;
  progress: number | null;
  error: Error | null;
  canRetry: boolean;
};
export type UploadOptions = FileRestrictions & {
  transport: UploadTransport;
  value?: UploadedImage | null;
  defaultValue?: UploadedImage | null;
  onChange?: (image: UploadedImage) => void;
  onUploadComplete?: (image: UploadedImage) => void;
  onReplace?: (result: ImageReplaceResult) => void;
  onError?: (error: Error) => void;
  onCallbackError?: (error: unknown) => void;
};
/** One active operation. No storage deletion, URL parsing, or React dependencies. */
export function createUploader(initial: UploadOptions) {
  let options = initial;
  let controlled = initial.value !== undefined;
  let state: UploadState = { status: 'idle', result: controlled ? initial.value! : initial.defaultValue ?? null, lastUpload: null, replacement: null, progress: null, error: null, canRetry: false };
  let operation = 0;
  let controller: AbortController | undefined;
  let lastFile: File | undefined;
  const listeners = new Set<() => void>();
  const emit = (patch: Partial<UploadState>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const stop = () => { operation++; controller?.abort(); controller = undefined; };
  const notify = (fn: (() => void) | undefined) => {
    try { fn?.(); } catch (error) { if (options.onCallbackError) options.onCallbackError(error); else console.error('Upload callback failed', error); }
  };
  async function upload(file: File): Promise<UploadedImage | undefined> {
    stop();
    const id = operation;
    const previous = state.result ? { ...state.result } : null;
    const config = options;
    lastFile = file;
    emit({ error: null, progress: null, replacement: null, canRetry: false });
    let next: UploadedImage;
    try {
      validateFile(file, config);
      controller = new AbortController();
      emit({ status: 'uploading' });
      next = normalizeImage(await config.transport(file, { signal: controller.signal, onProgress: p => {
        if (id === operation && state.status === 'uploading' && Number.isFinite(p.loaded) && Number.isFinite(p.total) && p.total > 0) emit({ progress: Math.max(0, Math.min(99, Math.round(p.loaded / p.total * 100))) });
      } }));
      if (id !== operation) return;
    } catch (cause) {
      if (id !== operation) return;
      controller = undefined;
      if (cause instanceof Error && cause.name === 'AbortError') { emit({ status: 'cancelled', progress: null, canRetry: true }); return; }
      const error = cause instanceof Error ? cause : new UploadError('Upload failed. Please retry.', 'upload');
      emit({ status: 'error', error, progress: null, canRetry: !(error instanceof UploadError && error.code === 'validation') });
      notify(() => config.onError?.(error));
      return;
    }
    controller = undefined;
    const replacement: ImageReplaceResult | null = previous ? { previousPath: previous.path, newPath: next.path, newUrl: next.url, newImageId: next.imageId } : null;
    emit({ status: 'success', result: controlled ? state.result : next, lastUpload: next, replacement, progress: 100, canRetry: false });
    lastFile = undefined;
    notify(() => config.onChange?.(next));
    notify(() => config.onUploadComplete?.(next));
    if (replacement) notify(() => config.onReplace?.(replacement));
    return next;
  }
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    configure(next: UploadOptions) { options = next; controlled = next.value !== undefined; },
    setValue(value: UploadedImage | null) {
      if (state.result?.path === value?.path && state.result?.url === value?.url && state.result?.imageId === value?.imageId) return;
      stop(); lastFile = undefined;
      const acknowledgesUpload = value !== null && state.lastUpload !== null && value.path === state.lastUpload.path;
      emit({ result: value, status: acknowledgesUpload ? 'success' : 'idle', error: null, progress: null, canRetry: false, replacement: acknowledgesUpload ? state.replacement : null });
    },
    upload,
    retry: () => lastFile && state.canRetry ? upload(lastFile) : Promise.resolve(undefined),
    cancel() { if (state.status !== 'uploading') return; stop(); emit({ status: 'cancelled', progress: null, error: null, canRetry: true }); },
    dispose() { stop(); lastFile = undefined; listeners.clear(); },
  };
}
