#!/usr/bin/env node
import { installComponent } from './install.mjs';
const [command, destination, ...extra] = process.argv.slice(2);
if ((command === '--help' || command === '-h') && !destination && !extra.length) {
  console.log('Usage: react-free-upload add <destination/image-uploader.tsx>');
} else if (command !== 'add' || !destination || extra.length) {
  console.error('Usage: react-free-upload add <destination/image-uploader.tsx>'); process.exitCode = 1;
} else {
  try {
    const target = await installComponent(destination);
    console.log(`Created ${target}. Install react_free_upload and Tailwind CSS; edit the source freely.`);
  } catch (error) { console.error(error.code === 'EEXIST' ? 'Destination exists; refusing to overwrite your source.' : error.message); process.exitCode = 1; }
}
