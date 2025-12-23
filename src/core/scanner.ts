import { lstatSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import type { Config, FileWithScore, PriorityRule } from '../types';
import {
  createGitignoreFilter,
  getPriorityScore,
  shouldSkipEntry,
} from './filter';

export function collectFilesRecursively(
  rootPath: string,
  config: Config,
  priorityRules: PriorityRule[],
  gitignore: boolean = true,
  exclude: string[] = [],
): FileWithScore[] {
  const files: FileWithScore[] = [];
  const gitignoreFilter = gitignore ? createGitignoreFilter(rootPath) : null;

  function scanDirectory(currentPath: string): void {
    try {
      const entries = readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = join(currentPath, entry);
        const relativePath = relative(rootPath, fullPath).replace(/\\/g, '/');
        const stats = lstatSync(fullPath);
        const isDirectory = stats.isDirectory();

        if (
          shouldSkipEntry(
            entry,
            relativePath,
            isDirectory,
            config,
            gitignoreFilter,
            exclude,
          )
        ) {
          continue;
        }

        if (isDirectory) {
          scanDirectory(fullPath);
        } else {
          const fileBasename = basename(fullPath);
          const fileDirname = dirname(relativePath);
          const score = getPriorityScore(
            relativePath,
            fileBasename,
            fileDirname,
            priorityRules,
          );

          files.push({
            path: fullPath,
            relativePath,
            score,
            size: stats.size,
          });
        }
      }
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;

      if (err.code !== 'EACCES' && err.code !== 'EPERM') {
        throw error;
      }
    }
  }

  scanDirectory(rootPath);
  return files;
}
