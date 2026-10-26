import { copyFile, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, dirname } from 'node:path';
export async function installComponent(destination) {
  const target = resolve(destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(new URL('./template.tsx', import.meta.url), target, constants.COPYFILE_EXCL);
  return target;
}
