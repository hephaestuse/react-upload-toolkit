# react_free_upload-cli

Version 0.1.0 release preparation. MIT © 2026 ahad mohammadi; see LICENSE. Packages have not been published, and registry name availability is unverified. Third-party dependencies retain their own licenses.

A dependency-free source-copy CLI. The archive includes its TSX template; it never reads the monorepo or downloads a registry component at runtime.

After installing this package locally:

```sh
npx --no-install react-free-upload --help
npx --no-install react-free-upload add components/image-uploader.tsx
```

Also install `react_free_upload-core` and `react_free_upload`, React, and Tailwind CSS 4 in the consuming app. Configure Tailwind to scan the copied component. The command creates missing parent directories and refuses to overwrite any existing file. An existing directory or an unwritable destination fails with a nonzero exit code. There is no force/overwrite mode or interactive prompt. Relative destinations are resolved from your current directory.

Edit the resulting TSX and classes freely; changing it does not change the installed package. The template uses a native file input, labels, described errors, status, cancel/retry, an image preview, and a hidden canonical-path form field. The add command copies a single file and does not configure aliases, Tailwind, dependencies or server routes for you.

The CLI writes to the supplied destination, including absolute paths: choose the consuming project's component directory. It never automatically deletes or replaces source or uploaded files.
