# Changelog

## 0.1.0 — unreleased

Release preparation for the intended `react_free_upload` project. This entry is not an announcement that packages have been published.

- TypeScript upload engine with file validation, configurable HTTP/custom transports, progress, retry and cancellation.
- React hook with controlled/uncontrolled state, canonical form values, upload callbacks and replacement receipts.
- Editable TSX/Tailwind source installed by a non-overwriting CLI.
- Local Next.js fixture and integration scenarios for new uploads, replacement, rollback and custom transports.
- Guards for superseded completions, late progress, reset state and temporary-preview cleanup.
- Core/React prepack builds, package READMEs, MIT licensing and public repository guides.
- Proposed package names: `react_free_upload-core`, `react_free_upload`, and `react_free_upload-cli`, each at 0.1.0. Registry availability remains unverified.
- Preferred CLI command `react-free-upload`, retaining `upload-toolkit` as an alias.

Function names, signatures and upload/replacement semantics are retained. The requested pre-release package rename changes import paths; see docs/migration.md. Browser E2E, axe and visual checks must be verified in an environment where they can execute.
