import { writeFileSync } from 'node:fs';
import type { OutputOptions } from '../types';
import { formatBytes } from '../utils/formatting';

export function writeOutput(
  content: string,
  _rootDir: string,
  options: OutputOptions = {},
): void {
  const outputSize = Buffer.from(content).length;

  if (options.stdout || !options.output) {
    console.log(content);
  }

  if (options.output) {
    writeFileSync(options.output, content, 'utf-8');
    console.log(
      `\nOutput written to ${options.output} (${formatBytes(outputSize)})`,
    );
  }

  if (options.stdout && options.output) {
    console.log(`\nContent size: ${formatBytes(outputSize)}`);
  }
}
