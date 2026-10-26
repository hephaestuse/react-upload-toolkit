# react_free_upload

Version 0.1.0 release preparation. MIT © 2026 ahad mohammadi; see LICENSE. Packages have not been published, and registry name availability is unverified. Third-party dependencies retain their own licenses.

ESM React hook with declarations and a preserved `'use client'` entry. React is a peer dependency (`^18.2.0 || ^19.0.0`); core is a regular dependency. There is no Next.js peer or runtime dependency. Check the release audit for the versions actually tested.

```tsx
'use client';
import { useState } from 'react';
import { createHttpTransport, type UploadedImage } from 'react_free_upload-core';
import { useImageUpload } from 'react_free_upload';

const transport = createHttpTransport({ endpoint: '/api/uploads' });
export function CoverForm() {
  const [value, onChange] = useState<UploadedImage | null>(null);
  const upload = useImageUpload({ transport, value, onChange });
  return <form>
    <input type="file" accept="image/png,image/jpeg,image/webp"
      onChange={event => {
        const file = event.target.files?.[0];
        if (file) void upload.upload(file);
        event.target.value = '';
      }} />
    <input type="hidden" name="imagePath" value={upload.field.value} />
  </form>;
}
```

The hook exposes `result`, `lastUpload`, `replacement`, `status`, `error`, `progress`, `canRetry`, `upload`, `retry`, `cancel`, and `field.value`. `null` progress is indeterminate. Controlled `value` remains authoritative; `onChange` proposes the successful candidate. Omit `value` and optionally supply `defaultValue` for uncontrolled usage. Keep the mode stable while mounted. Success callbacks are `onUploadComplete` and `onReplace`; replacement receipts contain both canonical paths.

In Next.js, instantiate transports and callbacks within a client component. Server components may render that client component with serializable initial image data. The hook is safe to render through SSR; browser-only transport work begins from user interaction.

For editable UI, install the companion CLI and run `npx --no-install react-free-upload add components/image-uploader.tsx`. The current template expects Tailwind CSS 4 in the consuming app. Runtime packages do not require Tailwind. The server remains responsible for upload authorization, validation, storage and access control.
