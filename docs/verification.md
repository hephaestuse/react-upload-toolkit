# Verification — 0.1.0 preparation

Date: 2026-10-26. No commit, push, remote repository creation or npm publication was performed. Production systems were not accessed.

## Executed results

- **40 tests passed across 8 files.** The prior upload/React/API/CLI tests were preserved. Three release tests check names, version/dependency/license alignment, CLI aliases, identical MIT files, source attribution and unchanged runtime export names.
- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed for both runtime packages and the existing Next.js example, including normal TypeScript checking and production compilation. The local upload fixture remains disabled in production mode.
- Packing all three renamed workspaces: passed. Core and React prepack builds ran. Archives include their README and LICENSE plus JS/declarations or the complete CLI/template files. No monorepo source, example storage, environments or local audit history appeared in the archive allowlists.
- Runtime export comparison before/after migration: passed. Core and React exported symbols are unchanged.
- npm local name validation: all three names returned `validForNewPackages: true`. Registry lookups failed with network/DNS errors, so name availability/owner rights are unverified.
- Initial workspace relinking reported lockfile-transition warnings. A second offline install completed without those warnings and retained the new workspace names. No runtime dependency was added to the toolkit.

## Clean packed consumer

A new temporary consumer outside the repository installed the actual renamed tarballs from its own `vendor/` directory, using npm and cached original host-dependency tarballs. All three toolkit packages are physical installs in its node_modules, not workspace links or source aliases. Its TSConfig and Next config do not extend the monorepo.

Tested environment: Node.js 24.16.0, npm 11.13.0, Next.js 16.3.4, React/React DOM 19.3.1, TypeScript 5.9.3 and Tailwind CSS 4.3.3. This is the executed matrix, not a claim that every declared peer/platform combination passed.

Results:

- Packed installation: passed, with 50 packages installed in the consumer.
- `react-free-upload --help` and legacy `upload-toolkit --help`: passed.
- `react-free-upload add`: passed and copied the packaged template.
- A second add to the same destination: correctly exited 1 and preserved the customized file.
- Local component customization: passed without modifying the installed CLI template.
- Copied MIT notice: verified in the installed template and copied source.
- Consumer TypeScript check: passed.
- Seven consumer tests: passed, covering canonical paths versus display URLs, local API integration, both replacement paths, old-file retention, controlled values, failure/retry/cancellation, SSR, a custom response/field adapter, validation and editable source.
- Consumer Next.js production build: passed with installed runtime packages and the copied Tailwind UI.
- Clean lockfile reinstall with `npm ci --offline --ignore-scripts --no-audit`: passed; all seven consumer tests passed again afterward.
- Legacy local-preview npm import aliases: installed successfully and passed an import/upload smoke check using the renamed archives, including the canonical core dependency. See migration.md.

The clean consumer's API is only a local development fixture. Tests call its handler in process and use synthetic requests; they do not send uploads to any production endpoint.

## Commands executed

From the repository:

```sh
npm install --offline --ignore-scripts --no-audit
npm run build:packages
npm run typecheck
npm run lint
npm test -- --reporter=default --reporter=json --outputFile=artifacts/oss-release/tests.json
npm test -- tests/release.test.ts
npm run build
npm pack -w react_free_upload-core -w react_free_upload -w react_free_upload-cli --pack-destination artifacts/oss-release/packs --json
npm pack -w react_free_upload-cli --pack-destination artifacts/oss-release/packs --json
```

The last CLI pack includes its final source-level MIT notice. Its actual tarball was reinstalled and checked in the consumer, which was then type-checked, tested and built again.

The name checks were:

```sh
npm view react_free_upload version --fetch-retries=0 --fetch-timeout=5000
npm view react_free_upload-core version --fetch-retries=0 --fetch-timeout=5000
npm view react_free_upload-cli version --fetch-retries=0 --fetch-timeout=5000
```

These returned network/DNS failures, not authoritative availability results. npm's installed name validator was also executed locally against all three names; all were technically valid.

From the temporary consumer:

```sh
npm install ./vendor/react_free_upload-core-0.1.0.tgz ./vendor/react_free_upload-0.1.0.tgz ./vendor/react_free_upload-cli-0.1.0.tgz --offline --no-audit
npx --no-install react-free-upload --help
npx --no-install upload-toolkit --help
npx --no-install react-free-upload add components/image-uploader.tsx
# After editing the copied source, the same add command safely exited 1.
npm run typecheck
npm test
npm run build
npm ls --all
npm ci --offline --ignore-scripts --no-audit
npm test
```

Host dependencies came from a local cache because registry networking was unavailable. This proves the tested archives work independently of the monorepo; it does not verify a fresh online registry install. The consumer's test command uses Node 24's `--test-isolation=none` so all seven assertions execute visibly in this restricted environment.

## Browser, accessibility and visual status

**Not passed or certified.** The browser suite was attempted against its own local fixture using:

```sh
npm run test:e2e -- --config artifacts/oss-release/playwright.config.mjs
npm run dev -w react-free-upload-example -- --port 3081
```

The runner failed before browser assertions when its fixture could not start. The direct startup diagnostic is retained in ignored local artifacts. Browser E2E, axe, real keyboard/file-picker interaction, visual focus, desktop/mobile layout, actual XHR progress/abort and browser resource behavior still need execution on a machine with socket/browser access. DOM-level resource and state assertions passed in the React tests. No browser screenshots or visual sign-off are claimed.

Playwright now defaults to its managed Chromium instead of a hard-coded machine-specific executable. Contributors should run `npx playwright install chromium` before a browser check, or deliberately supply `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for an existing local browser.

## Hygiene and remaining gates

A heuristic scan of Git-eligible files found no matching token/private-key signatures, credentialed URLs, local user installation paths, private-network URLs or internal application references. Historical machine-specific notes were preserved in ignored local history. Manual diff review remains required before the first commit; no scanner can prove the absence of all secrets.

MIT attribution is complete with the owner-provided holder. Remaining owner/release checks: npm names and version availability, the actual GitHub owner/URL, a private security-reporting channel, real browser/accessibility verification, fresh online installation/advisory checks and explicit authorization for any repository creation, commit, push or publication. See release-preparation.md for future steps.
