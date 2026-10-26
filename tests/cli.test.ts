import { expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { installComponent } from '../packages/cli/install.mjs';
it('installs editable source and refuses to overwrite customized files', async () => {
  mkdirSync('artifacts', { recursive: true }); const dir = mkdtempSync('artifacts/cli-test-'); const target = join(dir, 'image-uploader.tsx');
  await installComponent(target);
  expect(readFileSync(target, 'utf8')).toBe(readFileSync('registry/image-uploader/image-uploader.tsx', 'utf8'));
  writeFileSync(target, '// local customization');
  await expect(installComponent(target)).rejects.toMatchObject({ code: 'EEXIST' });
  expect(readFileSync(target, 'utf8')).toBe('// local customization');
  expect(readFileSync('examples/next-app/components/image-uploader.tsx', 'utf8')).toContain('Files stay in this local lab.');
});
