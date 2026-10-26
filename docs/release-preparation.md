# Version 0.1.0 release preparation

Prepared on 2026-10-26. **Nothing has been committed, pushed, created remotely or published by this task.** The project name is `react_free_upload`; the existing three-package architecture is retained.

## Package decisions and validation

- `react_free_upload`: main npm package and React integration.
- `react_free_upload-core`: independent upload engine, with no React/Next runtime dependency.
- `react_free_upload-cli`: editable-source installer, exposing `react-free-upload` and the compatibility command `upload-toolkit`.

Every package is version 0.1.0. Main depends on `react_free_upload-core` 0.1.0 and keeps React as a peer. No runtime function, callback or type signature was removed or renamed. The requested packaging/import-path migration is documented in migration.md, including a tested local alias option for preview consumers.

The installed npm `validate-npm-package-name` validator returned `validForNewPackages: true` for all three proposed names. They are lower-case, URL-friendly names under npm's length limit and do not begin with a prohibited leading character. An underscore inside a name is technically accepted; `react_free_upload` does not start with an underscore.

Authorized lookups were attempted:

```sh
npm view react_free_upload version --fetch-retries=0 --fetch-timeout=5000
npm view react_free_upload-core version --fetch-retries=0 --fetch-timeout=5000
npm view react_free_upload-cli version --fetch-retries=0 --fetch-timeout=5000
```

All failed with network/DNS errors. Availability, owner rights and unused versions are **unverified**. No alternative name was silently substituted. If a name is unavailable, stop and obtain an explicit naming decision.

## License and publication safeguards

The owner explicitly supplied **ahad mohammadi** as the copyright holder. LICENSE contains the standard MIT text with `Copyright (c) 2026 ahad mohammadi`, and each package includes an identical copy. Package metadata declares MIT. The copied UI template retains the full MIT notice in its source. Third-party dependencies retain their own licenses; the project's license does not relicense them.

The workspace root, example and all three package manifests remain private during preparation. Intended public registry/access settings are recorded in the three package manifests, but `private: true` still blocks publication. This is deliberate until names, versions and the exact release artifacts have been reviewed and publication is separately authorized. The workspace root and example should remain private permanently.

The future GitHub owner/URL is not supplied, so no repository/homepage URL or remote has been fabricated. Before public launch, configure the private security-reporting channel described in SECURITY.md.

## Public repository hygiene

Public documents are portable and contain no local absolute installation paths or internal application integration details. Historical integration/audit notes and their environment-specific verification script were preserved in the ignored `.local/pre-release-history/` directory. They were not deleted or executed. Old build artifacts, local caches and evidence stay ignored.

Ignore rules cover environments, credentials/key files, local uploads, dependency/build output, tarballs, editor files, generated framework agent guidance and private local history. A heuristic scan of Git-eligible files found no matching token/private-key signatures, credentialed URLs, machine-specific user paths, private network URLs or internal application references. This is a bounded check, not proof that no secret can exist. Review the exact staged diff before any future commit; ignored files that were already tracked would require separate review. At inspection time, the repository had no tracked source files and no remote.

No production application, server, database, API or credentials were accessed. No dependency was added to the toolkit for this migration. The UI design and working features were retained.

## Files changed and purpose

- Root/workspace manifests and lockfile: coherent package names, dependencies, MIT metadata, 0.1.0 versions and public publication intent with preparation guards retained.
- Runtime imports, tests, CLI template and example: new canonical package names; exported API surface preserved.
- CLI bin metadata/help: new preferred command, legacy command alias preserved.
- LICENSE files and copied UI source notices: owner-approved MIT attribution and permission text.
- README/package READMEs, API/migration/release/verification docs, CONTRIBUTING.md, SECURITY.md and CHANGELOG.md: public setup, contribution, security, release and migration guidance.
- .gitignore and eslint ignores: prevent private history, local environments and generated artifacts from entering a public repository.
- Playwright configuration: managed Chromium by default with an optional executable override, removing a hard-coded machine-specific browser path.
- DESIGN.md and PRODUCT.md: generic project context, preserving the actual UI without internal project references.
- Release tests: verify names, version/license/dependency alignment, CLI aliases, identical license files and unchanged runtime export names. Existing behavior tests remain in place.

See verification.md for actual commands/results and remaining browser limitations.

## Future GitHub steps — do not run as part of preparation

Only after the owner authorizes repository creation, chooses the GitHub account and reviews public files:

1. Run the checks in CONTRIBUTING.md, inspect `git status --short`, review all proposed source files and confirm ignored local material is excluded.
2. Stage only reviewed files. For this source tree, an explicit set is:

```sh
git add -- .gitignore .npmrc README.md LICENSE CONTRIBUTING.md SECURITY.md CHANGELOG.md DESIGN.md PRODUCT.md package.json package-lock.json eslint.config.mjs playwright.config.ts tsconfig.json tsconfig.check.json vitest.config.ts packages registry examples tests docs
git diff --cached --check
git diff --cached
```

3. Only after reviewing that diff, perform the future commit and repository creation. Replace `YOUR_ACCOUNT` with the approved owner; these commands are instructions, not actions already taken:

```sh
git commit -m "Prepare react_free_upload v0.1.0"
git branch -M main
GITHUB_OWNER=YOUR_ACCOUNT
gh auth status
gh repo create "$GITHUB_OWNER/react_free_upload" --public --source=. --remote=origin
git push -u origin main
```

4. Set repository descriptions/links to the actual public URL, enable private vulnerability reporting or provide a verified private contact, and confirm contribution/security docs point to real channels. No contact or remote is assumed to exist now.

## Future npm steps — require separate publication authorization

First confirm all three names and version 0.1.0 through an authorized registry connection and verify the intended npm identity. A not-found lookup is a point-in-time observation, not a reservation. If an existing package is found, confirm owner rights and unused versions; otherwise ask for an explicit alternative name.

Once the owner authorizes the actual release, remove the publication guards only from the three release packages:

```sh
npm whoami
npm pkg delete private --workspace react_free_upload-core --workspace react_free_upload --workspace react_free_upload-cli
npm run build
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
mkdir -p artifacts
npm pack -w react_free_upload-core -w react_free_upload -w react_free_upload-cli --pack-destination artifacts
```

Reinspect the exact new archives and repeat the clean consumer installation/build, because removing a manifest guard changes the archive. Ensure the current license text, declarations, client boundary, CLI template and security/contact information are present. Confirm advisory checks, supported browser/React checks and source provenance. Keep secrets in the chosen authentication mechanism; never add tokens to the repository.

Only after those steps and explicit permission to publish, the future order is core, main, then CLI:

```sh
npm publish artifacts/react_free_upload-core-0.1.0.tgz --access public
npm publish artifacts/react_free_upload-0.1.0.tgz --access public
npm publish artifacts/react_free_upload-cli-0.1.0.tgz --access public
```

These commands have **not** been executed. Review npm registry responses, install the actual registry versions in a new consumer, and only then authorize a version tag/release announcement. Commit/tag/push/repository creation/publication remain separate owner actions.
