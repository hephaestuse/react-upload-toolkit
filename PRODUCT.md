# react_free_upload

## Platform
TypeScript, React and an optional Next.js App Router example.

## Purpose
Single-image upload logic with canonical result paths, optional display URLs, replacement receipts, configurable transports and editable TSX UI distributed by a source-copy CLI.

## Boundaries
Core owns upload state, validation and transport coordination. React provides a hook. Applications own endpoints, authorization, server validation, storage and image lifecycle. Local examples and tests must use fixtures, mocks or loopback APIs. A replacement never deletes the old file automatically.

## Release preparation
Intended initial version 0.1.0 and MIT license. Package names are syntactically validated but registry availability and owner rights must be checked before a release. No publication, repository creation, push or commit is part of preparation.
