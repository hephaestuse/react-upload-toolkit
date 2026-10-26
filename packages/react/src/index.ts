'use client';
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createUploader, type UploadOptions } from 'react_free_upload-core';
export type { UploadedImage, ImageReplaceResult, UploadOptions, UploadTransport } from 'react_free_upload-core';

const useCommittedEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useImageUpload(options: UploadOptions) {
  const ref = useRef<ReturnType<typeof createUploader> | null>(null);
  if (!ref.current) ref.current = createUploader(options);
  const engine = ref.current;
  useCommittedEffect(() => { engine.configure(options); });
  const { path, url, imageId } = options.value ?? {};
  const controlled = options.value !== undefined;
  useCommittedEffect(() => { if (controlled) engine.setValue(path === undefined ? null : { path, url, imageId }); }, [engine, controlled, path, url, imageId]);
  useEffect(() => () => engine.cancel(), [engine]);
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  // Controlled values are authoritative even before the synchronization effect.
  const result = controlled ? options.value! : state.result;
  return { ...state, result, upload: engine.upload, retry: engine.retry, cancel: engine.cancel, field: { value: result?.path ?? '' } };
}
