import { resolve } from 'node:path';
import { cwd } from 'node:process';
import ora from 'ora';
import prompts from 'prompts';
import { addToHistory } from '../cli/history';
import { DEFAULT_CONFIG } from '../config/defaults';
import { PRIORITY_RULES } from '../config/priority';
import { collectFilesRecursively } from '../core/scanner';
import { isScriptFile, stripCommentsFromFile } from '../core/stripper';

interface StripOptions {
  gitignore?: boolean;
  exclude?: string[];
  yes?: boolean;
  dryRun?: boolean;
  noHistory?: boolean;
}

export async function runStrip(
  targetPath: string = '.',
  options: StripOptions,
) {
  const rootPath = resolve(cwd(), targetPath);

  const spinner = ora('Scanning for JS/TS files...').start();

  const allFiles = collectFilesRecursively(
    rootPath,
    DEFAULT_CONFIG,
    PRIORITY_RULES,
    options.gitignore ?? true,
    options.exclude ?? [],
  );

  const scriptFiles = allFiles.filter((f) => isScriptFile(f.path));

  if (scriptFiles.length === 0) {
    spinner.fail('No JS/TS files found matching criteria.');
    return;
  }

  spinner.succeed(`Found ${scriptFiles.length} script files.`);

  if (options.dryRun) {
    console.log('\nFiles that would be stripped:');

    scriptFiles.slice(0, 10).forEach((f) => {
      console.log(`- ${f.relativePath}`);
    });
    if (scriptFiles.length > 10)
      console.log(`...and ${scriptFiles.length - 10} more.`);
    return;
  }

  if (!options.yes) {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: `⚠️  Are you sure you want to remove ALL comments from ${scriptFiles.length} files in "${rootPath}"? This cannot be undone.`,
      initial: false,
    });

    if (!response.value) {
      console.log('Operation cancelled.');
      return;
    }
  }

  const progress = ora(
    `Stripping comments from ${scriptFiles.length} files...`,
  ).start();
  let modifiedCount = 0;

  for (const file of scriptFiles) {
    const changed = stripCommentsFromFile(file.path);
    if (changed) modifiedCount++;
  }

  progress.succeed(
    `Completed! Modified ${modifiedCount} of ${scriptFiles.length} files.`,
  );

  if (!options.noHistory) {
    const args = ['strip', targetPath];
    if (options.yes) args.push('--yes');

    if (options.exclude) {
      options.exclude.forEach((e) => {
        args.push('--exclude', e);
      });
    }
    addToHistory(args);
  }
}
