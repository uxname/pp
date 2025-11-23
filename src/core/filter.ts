import type { Config } from '../types';
import ignore from 'ignore';
import type { Ignore } from 'ignore';
import { isBinaryFile } from '../utils/fs';

export function createGitignoreFilter(rootPath: string): Ignore | null {
  const gitignorePath = `${rootPath}/.gitignore`;
  try {
    const gitignoreContent = require('fs').readFileSync(gitignorePath, 'utf8');
    return ignore().add(gitignoreContent);
  } catch (error) {
    return null;
  }
}

export function shouldSkipEntry(
  entryName: string,
  entryPath: string,
  isDirectory: boolean,
  config: Config,
  gitignoreFilter: Ignore | null,
  excludePatterns: string[]
): boolean {
  // Skip hidden files and directories (starting with .)
  if (entryName.startsWith('.')) {
    return true;
  }

  // Skip excluded directories
  if (isDirectory && config.EXCLUDED_DIRS.has(entryName)) {
    return true;
  }

  // Skip excluded files
  if (!isDirectory && config.EXCLUDED_FILES.has(entryName)) {
    return true;
  }

  // Skip files matching excluded patterns
  if (!isDirectory && Array.from(config.EXCLUDED_PATTERNS).some(
    pattern => {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(entryName);
    }
  )) {
    return true;
  }

  // Skip files not matching included extensions/names
  if (!isDirectory) {
    const extension = entryName.includes('.') 
      ? entryName.substring(entryName.lastIndexOf('.')) 
      : '';
    
    if (!config.INCLUDED_EXTENSIONS_AND_FILENAMES.has(entryName) &&
        !config.INCLUDED_EXTENSIONS_AND_FILENAMES.has(extension)) {
      return true;
    }
  }

  // Apply gitignore rules if enabled
  if (gitignoreFilter && gitignoreFilter.ignores(entryPath)) {
    return true;
  }

  // Apply custom exclude patterns
  if (excludePatterns.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(entryPath);
  })) {
    return true;
  }

  // Skip binary files
  if (!isDirectory && isBinaryFile(entryPath)) {
    return true;
  }

  return false;
}

export function getPriorityScore(
  relativePath: string,
  fileBasename: string,
  fileDirname: string,
  priorityRules: Array<{ score: number; test: (path: string, name: string, dir: string) => boolean }>
): number {
  for (const rule of priorityRules) {
    if (rule.test(relativePath, fileBasename, fileDirname)) {
      return rule.score;
    }
  }
  return 0;
}
