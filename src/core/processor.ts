import { relative } from 'node:path';
import type { FileWithScore } from '../types';
import { isBinaryFile, readFileContent } from '../utils/fs';

export function generateOutputContent(
  files: FileWithScore[],
  rootPath: string,
  maxFileSizeBytes: number,
): { content: string; skippedFiles: string[] } {
  const sortedFiles = [...files].sort((a, b) => b.score - a.score);
  const output: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of sortedFiles) {
    const relativePath = file.relativePath || relative(rootPath, file.path);

    try {
      if (file.size > maxFileSizeBytes) {
        skippedFiles.push(
          `${relativePath} (file too large: ${file.size} bytes)`,
        );
        continue;
      }

      if (isBinaryFile(file.path)) {
        skippedFiles.push(`${relativePath} (binary file)`);
        continue;
      }

      const content = readFileContent(file.path, maxFileSizeBytes);
      if (content === null) {
        skippedFiles.push(relativePath);
        continue;
      }

      output.push(`// File: ${relativePath}\n`);
      output.push(content);
      output.push('\n'.repeat(2));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error processing file ${relativePath}:`, error);
      skippedFiles.push(`${relativePath} (error: ${msg})`);
    }
  }

  if (skippedFiles.length > 0) {
    output.push('\n// Skipped files:\n');
    output.push(skippedFiles.map((f) => `// - ${f}`).join('\n'));
  }

  return {
    content: output.join('\n'),
    skippedFiles,
  };
}
