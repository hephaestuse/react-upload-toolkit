'use client';

/*
 * MIT License
 *
 * Copyright (c) 2026 ahad mohammadi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { useImageUpload, type UploadOptions } from 'react_free_upload';
import { defaultRestrictions } from 'react_free_upload-core';

export type ImageUploaderProps = UploadOptions & {
  name?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** Editable source. Customize the preview card, add tile, and controls in your application. */
export function ImageUploader({
  name = 'imagePath',
  label = 'Image',
  disabled = false,
  className = '',
  ...options
}: ImageUploaderProps) {
  const upload = useImageUpload(options);
  const id = useId();
  const selection = useRef(0);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [selectionError, setSelectionError] = useState('');
  const [dragging, setDragging] = useState(false);
  const busy = upload.status === 'uploading';

  useEffect(() => () => { selection.current += 1; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  useEffect(() => { if (!busy) setPreview(null); }, [busy]);

  async function select(files: File[]) {
    if (disabled || busy || !files.length) return;
    if (files.length !== 1) {
      setSelectionError('Select one image at a time.');
      return;
    }
    setSelectionError('');
    const selected = ++selection.current;
    const file = files[0]!;
    // Replacements keep the current image visible until the upload succeeds.
    if (!upload.result) setPreview({ file, url: URL.createObjectURL(file) });
    await upload.upload(file);
    if (selected === selection.current) setPreview(null);
  }

  const imageUrl = upload.result?.url ?? (!upload.result ? preview?.url : undefined);
  const error = selectionError || upload.error?.message;
  const hasImage = Boolean(imageUrl || upload.result);
  const ready = Boolean(upload.result && !busy);
  const restrictions = `${(options.acceptedTypes ?? defaultRestrictions.acceptedTypes).join(', ')} · up to ${(options.maxBytes ?? defaultRestrictions.maxBytes) / 1024 / 1024} MiB`;
  const input = (
    <input
      id={id}
      type="file"
      accept={(options.acceptedTypes ?? defaultRestrictions.acceptedTypes).join(',')}
      disabled={disabled || busy}
      aria-label={label}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
      aria-invalid={Boolean(error)}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      onChange={event => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        void select(files);
      }}
    />
  );

  return (
    <section className={`grid max-w-xl gap-3 text-zinc-900 ${className}`} aria-label={`${label} uploader`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <label className="text-sm font-medium" htmlFor={id}>{label}</label>
          <p id={`${id}-help`} className="mt-1 text-xs text-zinc-600">{restrictions}</p>
        </div>
        <span role="status" className={`inline-flex items-center gap-1.5 text-xs font-medium ${ready ? 'text-emerald-700' : 'text-zinc-600'}`}>
          {ready && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
          {busy ? 'Uploading…' : upload.status === 'success' ? 'Upload complete' : upload.status === 'cancelled' ? 'Upload cancelled' : ready ? 'Ready' : 'No image yet'}
        </span>
      </div>

      <div
        className={`grid w-full max-w-sm gap-3 rounded-xl ${dragging && !disabled && !busy ? 'outline-2 outline-offset-2 outline-emerald-800' : ''}`}
        onDragOver={event => { event.preventDefault(); if (!disabled && !busy) setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          void select(Array.from(event.dataTransfer.files));
        }}
      >
        {hasImage ? (
          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-300 bg-white">
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
              {imageUrl ? (
                <img src={imageUrl} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-600">Image saved. No display URL supplied.</p>
              )}
            </div>
            <div className="grid gap-4 p-3">
              {upload.result && (
                <label className="grid min-w-0 gap-1 text-sm">
                  Canonical path
                  <input
                    aria-label={`${label} canonical path`}
                    readOnly
                    value={upload.result.path}
                    className="w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-black"
                    onFocus={event => event.target.select()}
                  />
                </label>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className={`relative me-auto inline-flex min-h-10 items-center text-sm underline underline-offset-4 focus-within:outline-2 focus-within:outline-offset-2 ${disabled || busy ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:text-emerald-800'}`}>
                  {upload.result ? 'Replace image' : 'Choose image'}
                  {input}
                </label>
                {busy && <button type="button" onClick={upload.cancel} className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-100">Cancel upload</button>}
              </div>
            </div>
          </div>
        ) : (
          <label className={`relative flex min-h-64 min-w-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-400 bg-zinc-50 p-6 text-center focus-within:outline-2 focus-within:outline-offset-2 ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-emerald-800 hover:bg-emerald-50'}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M16 5h6m-3-3v6M3 16l5-5 9 10m-4-4 3-3 5 5" />
              <circle cx="8.5" cy="7.5" r="1.5" />
            </svg>
            <span className="text-sm font-medium">{busy ? 'Uploading…' : 'Add image'}</span>
            <span className="text-xs text-zinc-600">Drop one image here, or click to choose a file.</span>
            {input}
          </label>
        )}

        {busy && (
          <div className="grid gap-1.5">
            <div className="flex justify-between text-xs tabular-nums text-zinc-600">
              <span>Uploading image…</span>
              <span>{upload.progress === null ? 'Waiting for server' : `${upload.progress}%`}</span>
            </div>
            <progress aria-label="Upload progress" max={100} value={upload.progress ?? undefined} className="h-1.5 w-full overflow-hidden rounded-full accent-emerald-700" />
          </div>
        )}
      </div>

      {busy && !hasImage && <button type="button" onClick={upload.cancel} className="inline-flex min-h-10 items-center justify-center justify-self-start rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-100">Cancel upload</button>}
      <input type="hidden" name={name} value={upload.field.value} />
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
      {upload.canRetry && (
        <button disabled={disabled} type="button" className="inline-flex min-h-10 items-center justify-center justify-self-start rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-100 disabled:opacity-40" onClick={() => { setSelectionError(''); void upload.retry(); }}>Retry upload</button>
      )}
    </section>
  );
}
