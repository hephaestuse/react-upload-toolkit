# Public API and guarantees

## Core

`createUploader(options)` owns one active upload. `createHttpTransport(options)` implements browser XHR upload. `validateFile(file, restrictions)` validates MIME, nonzero size and maximum bytes. `normalizeImage(unknown)` validates the normalized response. `UploadError` carries a code and optional HTTP status.

```ts
type UploadTransport = (
  file: File,
  context: {
    signal: AbortSignal;
    onProgress(progress: { loaded: number; total: number }): void;
  },
) => Promise<UploadedImage>;
```

Options: required `transport`; optional `acceptedTypes` (exact MIME or wildcard), `maxBytes`, controlled `value`, uncontrolled `defaultValue`, `onChange`, `onUploadComplete`, `onReplace`, `onError`, `onCallbackError`. Defaults are PNG/JPEG/WebP and 5 MiB. Single file only. Browser MIME is not a security boundary.

The engine methods are `upload`, `retry`, `cancel`, `getSnapshot`, `subscribe`, `configure`, `setValue`, `dispose`. `configure` updates callbacks/transport for subsequent operations. `setValue` synchronizes external values and invalidates in-flight work when the image changes. `dispose` aborts and clears subscriptions. Core has no React or DOM preview requirements.

`upload` and `retry` resolve the normalized result on success, or `undefined` on validation, upload error, abort or supersession. Inspect state/error for failure details. A new upload supersedes an existing one. Custom transports may ignore abort, but their late results and progress cannot commit. Cancellation does not guarantee the server did not store a file.

## HTTP transport

Options: `endpoint`, `fieldName` (default `image`), `method` (POST/PUT), `headers`, `withCredentials` (cross-origin cookies), `timeoutMs` (60 seconds), `createBody(file)`, `mapResponse(payload)`, `errorMessage(payload, status)`.

Do not manually set multipart Content-Type. Same-origin cookies follow browser rules. Use `withCredentials` only as required by a configured cross-origin service. The library cannot bypass auth/CORS/CSRF. For signed URLs, custom headers, JSON requests, or multi-stage protocols, use a custom transport or body/response mapper. It is the adapter's responsibility to return an explicit canonical path. No URL or filename parsing occurs in core.

XHR reports upload-byte progress capped at 99 until the server confirms success; completion is 100. Late progress events after an operation settles are ignored. `null` means progress is unknown. Fetch custom transport in the example deliberately reports no progress. Network, timeout, HTTP and malformed-response errors are surfaced; error bodies can be mapped. No automatic retry: the user decides.

## React and forms

`useImageUpload(options)` returns a subscribed snapshot plus upload/retry/cancel and `field.value` (canonical path or empty string). The package entry and copied component contain `'use client'`; pass callback functions and transports within a client component, not across the server/client boundary.

Controlled mode is selected by `value !== undefined`, including `null`. The parent owns acceptance through `onChange`. When it declines a candidate, `result`, preview and hidden form field keep the supplied value; `lastUpload` and completion callbacks still report the successful upload. For consistent forms, update the controlled image and any separate path state together. Do not switch between controlled and uncontrolled mode during a mounted instance.

Each successful operation invokes `onChange`, `onUploadComplete`, then `onReplace` if an image was displayed when that operation began. The replace receipt snapshots that canonical path, even when it differs from its URL. Failure/cancellation never fires success callbacks. Callback exceptions are reported via `onCallbackError` (or console) and do not roll back successful uploads. If the application itself throws inside `onCallbackError`, that exception is application-owned.

External value changes abort pending work and clear retry state. A parent acknowledgement of the successful candidate retains the success receipt. Unmount cancels pending work; late results are ignored. The hook supports React StrictMode effect replay.

## Editable component

`ImageUploader` accepts hook options plus `name`, `label`, `disabled`, `className`. It supplies an associated native file input, keyboard access, drop target, described validation errors, live status, progress, cancel/retry, selectable canonical-path field and a hidden form input. Multiple dropped files are rejected explicitly. It never derives a display URL from `path`: a path-only result is shown as saved without a preview.

New-upload object URLs are revoked on completion, failure, cancellation, new selection and unmount. Replacement previews always retain the existing image. No cropping, image editing, removal API or automatic deletion is included.
