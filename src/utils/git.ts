import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function isGitRepo(cwd: string): boolean {
  try {
    if (existsSync(join(cwd, '.git'))) return true;
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function getGitChangedFiles(cwd: string): string[] {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8',
    }).trim();

    const output = execSync('git status --porcelain', {
      cwd: gitRoot,
      encoding: 'utf-8',
    });

    const files = output
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        let relativePath = line.substring(3).trim();

        if (relativePath.startsWith('"') && relativePath.endsWith('"')) {
          relativePath = relativePath.slice(1, -1);
        }

        if (relativePath.includes(' -> ')) {
          return resolve(gitRoot, relativePath.split(' -> ')[1]);
        }

        return resolve(gitRoot, relativePath);
      });

    return Array.from(new Set(files));
  } catch (error) {
    console.warn('Warning: Failed to read git status.', error);
    return [];
  }
}
