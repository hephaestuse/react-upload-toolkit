import { test, expect } from 'playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import sharp from 'sharp';
import { mkdir, appendFile } from 'node:fs/promises';
const image = async (color = '#28594c') => ({ name: 'test.png', mimeType: 'image/png', buffer: await sharp({ create: { width: 128, height: 96, channels: 3, background: color } }).png().toBuffer() });
test.beforeEach(async ({ page }) => {
  await mkdir('artifacts', { recursive: true });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    await appendFile('artifacts/browser-requests.jsonl', JSON.stringify({ method: route.request().method(), url: url.href }) + '\n');
    if (url.hostname !== '127.0.0.1') { await route.abort(); throw new Error(`Non-local request blocked: ${url.href}`); }
    await route.continue();
  });
  await page.goto('/');
});
test('new upload, normalized form state, keyboard access and accessibility', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles(await image());
  await expect(page.getByTestId('form-path')).toHaveValue(/^test-images\//);
  await expect(page.getByRole('img')).toBeVisible();
  await expect(page.locator('input[type=hidden]')).toHaveValue(await page.getByTestId('form-path').inputValue());
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  expect(await page.evaluate(async () => (await (window as unknown as { axe: { run(): Promise<{ violations: unknown[] }> } }).axe.run()).violations)).toEqual([]);
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('replacement success preserves old server file and displays both paths', async ({ page, request }) => {
  await page.getByRole('button', { name: 'Replace image', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(await image());
  await expect(page.getByTestId('replace-calls')).toHaveText('1');
  const oldPath = await page.getByTestId('form-path').inputValue();
  const oldUrl = await page.getByRole('img').getAttribute('src');
  await page.getByLabel(/Delay response/).check();
  await page.locator('input[type=file]').setInputFiles(await image('#b76442'));
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByRole('img')).toHaveAttribute('src', oldUrl!);
  await expect(page.getByTestId('replace-calls')).toHaveText('2');
  const newPath = await page.getByTestId('form-path').inputValue(); expect(newPath).not.toBe(oldPath);
  await expect(page.getByTestId('replacement')).toContainText(oldPath); await expect(page.getByTestId('replacement')).toContainText(newPath);
  expect((await request.get(oldUrl!)).status()).toBe(200);
  await page.getByRole('button', { name: 'Verify old image still exists' }).click(); await expect(page.getByText('Old image still exists (HTTP 200).')).toBeVisible();
});
test('failed replacement rolls back and retry succeeds', async ({ page }) => {
  await page.getByRole('button', { name: 'Failure & retry' }).click();
  await page.locator('input[type=file]').setInputFiles(await image());
  await expect(page.getByRole('alert')).toContainText('Simulated upload failure');
  await expect(page.getByTestId('form-path')).toHaveValue('fixtures/original.svg');
  await expect(page.getByRole('img')).toHaveAttribute('src', '/original.svg');
  await expect(page.getByTestId('replace-calls')).toHaveText('0');
  await page.getByLabel('Simulate server failure').uncheck(); await page.getByRole('button', { name: 'Retry upload' }).click();
  await expect(page.getByTestId('replace-calls')).toHaveText('1');
});
test('cancel replacement and use custom transport', async ({ page }) => {
  await page.getByRole('button', { name: 'Replace image', exact: true }).click();
  await page.getByLabel(/Delay response/).check(); await page.locator('input[type=file]').setInputFiles(await image());
  await page.getByRole('button', { name: 'Cancel upload' }).click();
  await expect(page.getByTestId('form-path')).toHaveValue('fixtures/original.svg'); await expect(page.getByTestId('replace-calls')).toHaveText('0');
  await page.getByRole('button', { name: 'Custom transport', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(await image());
  await expect(page.getByTestId('form-path')).toHaveValue(/^test-images\//);
});
test('local API rejects invalid requests', async ({ request }) => {
  const response = await request.post('/api/uploads', { multipart: { image: { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not-image') } } }); expect(response.status()).toBe(422);
  expect((await request.post('/api/uploads', { multipart: { wrong: 'field' } })).status()).toBe(400);
});
