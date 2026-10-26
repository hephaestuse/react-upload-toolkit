# Contributing

## Local setup

Use Node.js 20.9+ and npm. The currently executed platform/version checks are listed in docs/verification.md; additional versions are not implied to have passed.

```sh
npm ci
npm run build:packages
npm run dev
```

Use mocks or the local development fixture for all testing. Do not introduce credentials, private endpoints or access to production applications. Never commit environment files, uploads, reports, node_modules, archives or build output.

## Architecture and changes

- Keep core independent of React, Next.js and storage implementations.
- Keep React integration in its existing package and browser code behind a client boundary.
- Distribute the default UI as editable source, not a closed UI dependency.
- Keep canonical paths distinct from display URLs.
- Preserve old images on failure/cancel; emit replacement receipts only after success.
- Never add automatic deletion or storage lifecycle behavior.
- Explain API changes and update types, examples, documentation and tests together.

If you edit the UI template, synchronize its CLI copy:

```sh
cp registry/image-uploader/image-uploader.tsx packages/cli/template.tsx
```

The example's copied UI can keep deliberate local customization. Do not overwrite it blindly.

## Required checks

```sh
npm run build
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

For distribution changes, also build/package the three workspaces and test the actual tarballs in a separate consumer. Check that archives contain README, LICENSE, JS/types or the CLI template, and no local environments or uploads. Core and React prepack builds must remain enabled. If a check is blocked, report it explicitly rather than recording a pass.

## Contributions and reporting

Keep changes focused, explain the concrete problem and validation, and preserve existing behavior unless a justified API change is documented. By submitting a contribution, you agree that your contribution can be distributed under the project's MIT license. Third-party code/assets need their own compatible permissions and attribution.

Report security concerns through the process in SECURITY.md; do not place exploit details or credentials in public issues. No commit, remote, push or package publication should be performed by automated tooling without the owner's explicit authorization.
