import { writeFileSync } from 'fs';
import { formatBytes } from '../utils/formatting';
import type { OutputOptions } from '../types';

export function writeOutput(
    content: string,
    rootDir: string,
    options: OutputOptions = {}
): void {
    const outputSize = Buffer.from(content).length;

    if (options.stdout || !options.output) {
        console.log(content);
    }

    if (options.output) {
        writeFileSync(options.output, content, 'utf-8');
        console.log(`\nOutput written to ${options.output} (${formatBytes(outputSize)})`);
    }

    if (options.stdout && options.output) {
        console.log(`\nContent size: ${formatBytes(outputSize)}`);
    }
}