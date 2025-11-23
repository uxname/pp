#!/usr/bin/env node

import { program } from 'commander';
import { resolve } from 'path';
import { cwd } from 'process';
import ora from 'ora';
import { collectFilesRecursively } from './core/scanner';
import { generateOutputContent } from './core/processor';
import { writeOutput } from './cli/output';
import { addToHistory, showHistoryMenu } from './cli/history';
import { Logger } from './utils/logger';
import { DEFAULT_CONFIG } from './config/defaults'; // <--- IMPORTS
import { PRIORITY_RULES } from './config/priority'; // <--- IMPORTS

const logger = new Logger(process.env.NODE_ENV === 'test');

async function run(args: string[] = []): Promise<void> {
    const spinner = ora('Scanning files...').start();

    try {
        const targetPath = args[0] || '.';
        const rootPath = resolve(cwd(), targetPath);

        // Исправлен вызов (передаем конфиг и правила)
        const files = collectFilesRecursively(
            rootPath,
            DEFAULT_CONFIG,
            PRIORITY_RULES,
            program.opts().gitignore,
            program.opts().exclude
        );

        spinner.succeed(`Found ${files.length} files`);

        // Исправлен вызов (передаем Max Size)
        const { content, skippedFiles } = generateOutputContent(
            files,
            rootPath,
            DEFAULT_CONFIG.MAX_FILE_SIZE_BYTES
        );

        if (skippedFiles.length > 0) {
            console.log(`\nSkipped ${skippedFiles.length} files (too large, binary, or unreadable)`);
        }

        // Исправлен вызов (передаем rootPath вторым аргументом)
        writeOutput(content, rootPath, {
            stdout: program.opts().stdout,
            output: program.opts().output
        });

        if (!program.opts().noHistory) {
            addToHistory(args);
        }
    } catch (error: unknown) { // <--- unknown
        const msg = error instanceof Error ? error.message : String(error);
        spinner.fail(`Error: ${msg}`);
        process.exit(1);
    }
}

async function main() {
    // ... (весь код main оставляем без изменений, он корректен) ...
    const SYSTEM_ARGS_COUNT = 2;

    program
        .version("1.4.0")
        .description("Scans a directory...")
        .arguments("[path]")
        .option("-o, --output <file>", "Output file")
        .option("--stdout", "Print output to stdout")
        .option("--no-gitignore", "Disable .gitignore")
        .option("-e, --exclude <patterns...>", "Exclude patterns", [])
        .option("--no-history", "Disable history", false)
        .action(async (path, options) => {
            const args = [path || "."];
            if (options.output) args.push("--output", options.output);
            if (options.stdout) args.push("--stdout");
            if (!options.gitignore) args.push("--no-gitignore");
            if (options.exclude && options.exclude.length > 0) {
                options.exclude.forEach((pattern: string) => args.push("--exclude", pattern));
            }
            if (options.noHistory) args.push("--no-history");
            await run(args);
        });

    if (process.argv.length <= SYSTEM_ARGS_COUNT) {
        const historyArgs = await showHistoryMenu();
        if (historyArgs) {
            await run([...historyArgs, "--no-history"]);
        }
        return;
    }

    program.parse(process.argv);
}

main().catch(console.error);