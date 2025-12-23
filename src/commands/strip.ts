import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { cwd } from 'node:process';
import ora from 'ora';
import prompts from 'prompts';
import { addToHistory } from '../cli/history';
import { DEFAULT_CONFIG } from '../config/defaults';
import { PRIORITY_RULES } from '../config/priority';
import { collectFilesRecursively } from '../core/scanner';
import { isScriptFile, stripCommentsFromFile } from '../core/stripper';
import { getGitChangedFiles, isGitRepo } from '../utils/git';

interface StripOptions {
  gitignore?: boolean;
  exclude?: string[];
  yes?: boolean;
  dryRun?: boolean;
  noHistory?: boolean;
  all?: boolean;
}

export async function runStrip(
  targetPath: string = '.',
  options: StripOptions,
) {
  const rootPath = resolve(cwd(), targetPath);

  let filesToProcess: { path: string; relativePath: string }[] = [];
  const spinner = ora('Analyzing files...').start();

  const useGit = !options.all && isGitRepo(rootPath);

  if (useGit) {
    spinner.text = 'Checking git status for changed files...';
    const changedFiles = getGitChangedFiles(rootPath);

    const filesInScope = changedFiles.filter(
      (f) => f.startsWith(rootPath) && existsSync(f),
    );

    filesToProcess = filesInScope.map((f) => ({
      path: f,
      relativePath: relative(rootPath, f),
    }));

    if (filesToProcess.length === 0) {
      spinner.fail(
        'No changed or untracked files found via git (or files were deleted).',
      );
      console.log('💡 Tip: Use "--all" to scan the entire directory.');
      return;
    }
  } else {
    spinner.text = 'Scanning directory...';
    const scannedFiles = collectFilesRecursively(
      rootPath,
      DEFAULT_CONFIG,
      PRIORITY_RULES,
      options.gitignore ?? true,
      options.exclude ?? [],
    );
    filesToProcess = scannedFiles;
  }

  const scriptFiles = filesToProcess.filter((f) => isScriptFile(f.path));

  if (scriptFiles.length === 0) {
    spinner.fail(
      useGit
        ? 'No changed JS/TS files found.'
        : 'No JS/TS files found matching criteria.',
    );
    return;
  }

  spinner.succeed(
    useGit
      ? `Found ${scriptFiles.length} changed script files (Git mode).`
      : `Found ${scriptFiles.length} script files (Full scan).`,
  );

  if (options.dryRun) {
    console.log('\nFiles that would be processed:');
    scriptFiles.slice(0, 10).forEach((f) => {
      console.log(`- ${f.relativePath}`);
    });
    if (scriptFiles.length > 10)
      console.log(`...and ${scriptFiles.length - 10} more.`);
    return;
  }

  if (!options.yes) {
    const contextMsg = useGit ? 'modified/untracked' : 'found';
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: `⚠️  Are you sure you want to remove ALL comments from ${scriptFiles.length} ${contextMsg} files?`,
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
    if (options.all) args.push('--all');

    if (options.exclude) {
      options.exclude.forEach((e) => {
        args.push('--exclude', e);
      });
    }
    addToHistory(args);
  }
}
