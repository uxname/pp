import { readdirSync, lstatSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import type { Config, FileWithScore, PriorityRule } from '../types'; // <--- import type
import { shouldSkipEntry, getPriorityScore, createGitignoreFilter } from './filter';
import type { Ignore } from 'ignore'; // <--- import type

export function collectFilesRecursively(
    rootPath: string,
    config: Config,
    priorityRules: PriorityRule[],
    gitignore: boolean = true,
    exclude: string[] = []
): FileWithScore[] {
    const files: FileWithScore[] = [];
    const gitignoreFilter = gitignore ? createGitignoreFilter(rootPath) : null;

    function scanDirectory(currentPath: string): void {
        try {
            const entries = readdirSync(currentPath);

            for (const entry of entries) {
                const fullPath = join(currentPath, entry);
                const relativePath = relative(rootPath, fullPath).replace(/\\/g, "/");
                const stats = lstatSync(fullPath);
                const isDirectory = stats.isDirectory();

                if (shouldSkipEntry(
                    entry,
                    relativePath, // Передаем относительный путь
                    isDirectory,
                    config,
                    gitignoreFilter,
                    exclude
                )) {
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
                        priorityRules
                    );

                    files.push({
                        path: fullPath,
                        relativePath,
                        score,
                        size: stats.size // Теперь это поле есть в types.ts
                    });
                }
            }
        } catch (error: unknown) { // <--- unknown
            const err = error as NodeJS.ErrnoException; // <--- cast
            // Skip directories we can't access
            if (err.code !== 'EACCES' && err.code !== 'EPERM') {
                throw error;
            }
        }
    }

    scanDirectory(rootPath);
    return files;
}