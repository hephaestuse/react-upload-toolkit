import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['.local/**','**/dist/**','**/.next/**','**/node_modules/**','artifacts/**','test-results/**','playwright-report/**','**/next-env.d.ts']},js.configs.recommended,...ts.configs.recommended,{languageOptions:{globals:{process:'readonly',console:'readonly',URL:'readonly',fetch:'readonly',Buffer:'readonly'}},rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}});
