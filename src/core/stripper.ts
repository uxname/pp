import { readFileSync, writeFileSync } from 'node:fs';

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

    const patternStrings =
      '"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'(?:\\\\[\\s\\S]|[^\'\\\\])*\'|`(?:[^`\\\\]|\\\\.)*`';

    const patternComments = '//[^\\n\\r]*|/\\*[\\s\\S]*?\\*/';

    const regex = new RegExp(`(${patternStrings})|(${patternComments})`, 'g');

    const stripped = content.replace(regex, (_match, str, _comment) => {
      if (typeof str !== 'undefined') {
        return str;
      }

      return '';
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
