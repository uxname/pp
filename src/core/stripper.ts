import { readFileSync, writeFileSync } from 'node:fs';
import strip from 'strip-comments';

const SUPPORTED_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

export function isScriptFile(path: string): boolean {
  const ext = path.substring(path.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function stripCommentsFromFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');

    const stripped = strip(content, {
      keepProtected: false,
      preserveNewlines: false,
    });

    const cleaned = stripped.replace(/(\r\n|\r|\n){3,}/g, '\n\n');

    if (content === cleaned) {
      return false;
    }

    writeFileSync(filePath, cleaned, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error stripping file ${filePath}:`, error);
    return false;
  }
}
