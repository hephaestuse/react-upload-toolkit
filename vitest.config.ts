import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { pool: 'threads', maxWorkers: 1, include: ['tests/**/*.test.{ts,tsx}'], environment: 'node', restoreMocks: true } });
