# react_free_upload-core

Version 0.1.0 release preparation. MIT © 2026 ahad mohammadi; see LICENSE. Packages have not been published, and registry name availability is unverified. Third-party dependencies retain their own licenses.

A dependency-free TypeScript image upload engine. ESM only; declarations are included. No React, Next.js, storage service, or application module is required.

```ts
import { createUploader, createHttpTransport } from 'react_free_upload-core';

const uploader = createUploader({
  transport: createHttpTransport({ endpoint: '/api/uploads' }),
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  onUploadComplete: image => console.log(image.path),
  onReplace: image => console.log(image.previousPath, image.newPath),
});
```

The default browser transport sends multipart `image` and expects `{ path: string; url?: string; imageId?: string }`. Configure `fieldName`, `createBody`, `mapResponse`, headers and credentials for other HTTP contracts, or supply a custom `(file, { signal, onProgress }) => Promise<UploadedImage>` transport.

`path` is a canonical application identifier, and `url` is a display URL. Neither is derived from the other. `upload(file)` returns the normalized result or `undefined` after failure, cancellation or supersession. Read `getSnapshot()` for status, result, error, progress and retry availability; use `subscribe`, `retry`, `cancel`, and `dispose` for lifecycle management. Cancelled/failed replacements retain the existing result. No file is ever deleted automatically.

XHR is instantiated only when a browser HTTP upload starts. Importing the package during SSR is safe. Custom transports must honor the supplied AbortSignal when possible. The engine ignores obsolete completions/progress even when a transport ignores cancellation. A cancelled client cannot guarantee server rollback.

Client MIME/size checks are advisory. The consuming server owns authorization, validation, storage and access control. Accept only trusted display URLs and apply your application's URL/CSP policy.
