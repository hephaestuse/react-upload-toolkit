import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as core from 'react_free_upload-core';
import * as react from 'react_free_upload';
const manifest = (name: string) => JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'));
it('coordinates the three release names, versions, MIT metadata and CLI aliases', () => {
  expect(manifest('core').name).toBe('react_free_upload-core');
  expect(manifest('react').name).toBe('react_free_upload');
  expect(manifest('cli').name).toBe('react_free_upload-cli');
  for (const name of ['core', 'react', 'cli']) {
    expect(manifest(name).version).toBe('0.1.0');
    expect(manifest(name).license).toBe('MIT');
    expect(manifest(name).publishConfig).toEqual({ access: 'public', registry: 'https://registry.npmjs.org/' });
  }
  expect(JSON.parse(readFileSync('package.json', 'utf8')).private).toBe(true);
  expect(manifest('react').dependencies).toEqual({ 'react_free_upload-core': '0.1.0' });
  expect(manifest('cli').bin).toEqual({ 'react-free-upload': './index.mjs', 'upload-toolkit': './index.mjs' });
});
it('ships identical MIT license text with the owner-provided attribution', () => {
  const license = readFileSync('LICENSE', 'utf8');
  expect(license).toContain('Copyright (c) 2026 ahad mohammadi');
  expect(license).toContain('Permission is hereby granted, free of charge');
  for (const name of ['core', 'react', 'cli']) expect(readFileSync(`packages/${name}/LICENSE`, 'utf8')).toBe(license);
  expect(readFileSync('packages/cli/template.tsx', 'utf8')).toContain('Copyright (c) 2026 ahad mohammadi');
  expect(readFileSync('packages/cli/template.tsx', 'utf8')).toContain('Permission is hereby granted, free of charge');
});
it('preserves runtime exports across the packaging-name migration', () => {
  expect(Object.keys(core).sort()).toEqual(['UploadError', 'createHttpTransport', 'createUploader', 'defaultRestrictions', 'normalizeImage', 'validateFile'].sort());
  expect(Object.keys(react)).toEqual(['useImageUpload']);
});
