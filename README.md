# react_free_upload

A TypeScript image-upload engine, React hook, and editable TSX uploader. The logic lives in small runtime packages; the UI source is copied into your application and remains yours to edit.

**Version 0.1.0 is being prepared, not published.** The intended package names pass npm's local validator, but registry availability has not been verified. Packages remain private as a publication safeguard. See [release preparation](docs/release-preparation.md) and [verification](docs/verification.md).

## Packages

- `react_free_upload-core`: dependency-free upload state engine, validation and browser HTTP transport.
- `react_free_upload`: React integration; depends on core and has React as a peer dependency.
- `react_free_upload-cli`: self-contained source-copy CLI. The preferred command is `react-free-upload`; `upload-toolkit` remains a compatibility alias.

Runtime packages are ESM only, with generated TypeScript declarations. They do not require Next.js or Tailwind. Public types use browser File/XHR contracts, so TypeScript consumers need DOM type libraries. The copied default UI targets Tailwind CSS 4.

## Run the local example

Repository tooling requires Node.js 20.9+ and npm; current verification uses Node.js 24. Commands below assume a POSIX shell.

```sh
npm ci
npm run build:packages
npm run dev
```

Open `http://127.0.0.1:3047`. The App Router example uses only its local development API. It demonstrates new uploads, successful replacements with both paths, failure/retry, cancellation, a custom transport, and locally customized component source. Its upload/read fixtures are disabled in production mode.

## Install from local archives

Until the packages are actually released, use packed files rather than registry installation:

```sh
npm run build:packages
mkdir -p artifacts
npm pack -w react_free_upload-core -w react_free_upload -w react_free_upload-cli --pack-destination artifacts
```

Copy the three `.tgz` files to a `vendor/` directory in your consuming project, then run there:

```sh
npm install ./vendor/react_free_upload-core-0.1.0.tgz ./vendor/react_free_upload-0.1.0.tgz ./vendor/react_free_upload-cli-0.1.0.tgz
npx --no-install react-free-upload add components/image-uploader.tsx
```

No monorepo source, aliases or shared TSConfig are needed after installation. React and React DOM belong to the consuming application. The hook's declared React peer range is `^18.2.0 || ^19.0.0`; see verification for the versions actually tested.

For a Next.js application without Tailwind 4:

```sh
npm install tailwindcss @tailwindcss/postcss
```

Create `postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

Add `@import 'tailwindcss';` to your global CSS and import that stylesheet from `app/layout.tsx`. Keep the copied component inside Tailwind's scanned source tree. Tailwind 3 and all browser combinations have not been verified.

## Use the editable uploader

```tsx
'use client';
import { useState } from 'react';
import { createHttpTransport, type UploadedImage } from 'react_free_upload-core';
import { ImageUploader } from './components/image-uploader';

const transport = createHttpTransport({ endpoint: '/api/uploads' });
export function CoverForm() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [imagePath, setImagePath] = useState('');
  return <form>
    <ImageUploader
      name="coverPath"
      transport={transport}
      value={image}
      onChange={setImage}
      onUploadComplete={result => setImagePath(result.path)}
      onReplace={({ previousPath, newPath }) => {
        console.log({ previousPath, newPath });
      }}
    />
    <output>{imagePath}</output>
  </form>;
}
```

For replacement, initialize `image` with the existing canonical path and optional display URL. The old image stays visible until the replacement succeeds. Failure or cancellation preserves its image/path, and `onReplace` fires only on success. The toolkit never automatically deletes either image.

```ts
type UploadedImage = { path: string; url?: string; imageId?: string };
type ImageReplaceResult = {
  previousPath: string;
  newPath: string;
  newUrl?: string;
  newImageId?: string;
};
```

`path` is the application's canonical identifier. `url` is an optional display URL. Neither is derived from the other. The default transport sends multipart `image` and expects this normalized result; configure its field/body/response mapping or supply a custom transport for another API.

For a UI-independent form, import `useImageUpload` from `react_free_upload`. It exposes the current result, last upload, replacement receipt, status, error, progress, retry/cancel actions and canonical `field.value`. See the [API documentation](docs/api.md).

## Own the UI source

The CLI creates missing parent directories and refuses to overwrite an existing file. Re-running `add` on the same destination fails safely. It installs one TSX file; it does not configure dependencies, styles, authentication, storage, or API routes. Edit the markup and Tailwind classes directly. The example app demonstrates this by changing its copied instructions.

The canonical template is `registry/image-uploader/image-uploader.tsx`; its packaged copy is `packages/cli/template.tsx`. Contributor template edits must keep both in sync; tests enforce equality. The CLI never fetches a remote registry at runtime.

## Validation and local storage

Defaults are PNG/JPEG/WebP and 5 MiB. The example server also bounds and decodes files. Client MIME/size checks are advisory: the consuming server owns authorization, independent validation, storage and access control. The example is a development fixture, not a public production upload service. Cancellation does not guarantee server-side rollback.

Test files live in the ignored `examples/next-app/.dev-storage/` directory. Stop the example and remove that directory to clean uploads. Preserve the static `public/original.svg` fixture. Test reports and local archives live in ignored `artifacts/` and `test-results/` directories.

## Contribute and verify

```sh
npm run build
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Playwright uses its installed Chromium by default. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if you deliberately want another local executable. Browser tests start their own local fixture and refuse to reuse a running server. Browser E2E, axe and visual checks remain unverified where socket/browser access is blocked; they are not reported as passed.

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md), and the [migration notes](docs/migration.md).

## License

MIT © 2026 ahad mohammadi. See [LICENSE](LICENSE). Third-party dependencies retain their own licenses; this project's MIT grant does not relicense them.
