# Pre-release naming migration

The intended repository/project name is `react_free_upload`. The existing three-package architecture is preserved:

- React integration/main package: `react_free_upload`.
- UI-independent engine: `react_free_upload-core`.
- Source-copy installer: `react_free_upload-cli`.

All versions remain 0.1.0. A single npm name cannot identify three different packages. Assigning the requested unscoped name to the React entry point makes it the main consumer-facing package, while the core and CLI retain independent distribution and dependencies. These names passed npm's installed `validate-npm-package-name` validator. Authorized registry lookups were attempted but failed because network access was blocked; no availability or ownership claim is made.

## Import paths

The former local-preview package paths were `@upload-toolkit/react`, `@upload-toolkit/core`, and `@upload-toolkit/cli`. Update imports and local archive installation together:

```ts
import { useImageUpload } from 'react_free_upload';
import { createHttpTransport, createUploader } from 'react_free_upload-core';
```

This is an intentional, documented packaging migration requested before the first project release. Exported functions, types, option signatures, callbacks and behavior are unchanged. Old package names are not taken over, reserved, or assumed to belong to this project. Previously packed local archives are not rewritten.

For a local-preview consumer that must retain its existing imports during a staged migration, npm package aliases can point at the new local archives, for example:

```sh
npm install @upload-toolkit/react@file:./vendor/react_free_upload-0.1.0.tgz @upload-toolkit/core@file:./vendor/react_free_upload-core-0.1.0.tgz ./vendor/react_free_upload-core-0.1.0.tgz
```

The third archive installs the React package's declared canonical `react_free_upload-core` dependency in the same operation when working offline. Prefer migrating to the canonical imports to avoid maintaining duplicate aliases.

## CLI and source

The preferred executable is `react-free-upload`; the former `upload-toolkit` command remains a bin alias. `add` still refuses existing destinations. Existing copied UI is application-owned and is not overwritten during package installation. Update its imports manually, or install the new template at a different destination and review the changes.

Do not copy workspace TSConfig files or source aliases into a consumer. Install the built runtime archives and the packaged CLI. Name validation is separate from registry availability: if any proposed name is already owned, stop the release process and ask the owner to choose a new name rather than silently substituting one.
