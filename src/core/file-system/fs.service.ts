import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { glob } from 'tinyglobby';
import { ConfigService } from '../config/config.service';

@Injectable()
export class FsService {
  constructor(private readonly configService: ConfigService) {}

  async findProjectFiles(
    options: { ignore?: string[]; useGitignore?: boolean } = {},
  ): Promise<string[]> {
    const { packer } = this.configService.getConfig();
    const shouldUseGitignore = options.useGitignore ?? packer.useGitignore;
    const gitignore = shouldUseGitignore
      ? await this.readGitignorePatterns()
      : [];
    const ignorePatterns = this.normalizeIgnorePatterns([
      ...(options.ignore ?? packer.ignore),
      ...gitignore,
    ]);

    const entries = await glob(['**/*'], {
      onlyFiles: true,
      absolute: true,
      ignore: ignorePatterns,
    });

    return entries
      .map((entry) => path.relative(process.cwd(), entry))
      .filter((relative) => relative.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }

  async readFileRelative(relativePath: string): Promise<string> {
    const absolute = path.resolve(process.cwd(), relativePath);
    return fs.readFile(absolute, 'utf8');
  }

  private async readGitignorePatterns(): Promise<string[]> {
    const gitignorePath = path.join(process.cwd(), '.gitignore');

    try {
      const content = await fs.readFile(gitignorePath, 'utf8');
      return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
    } catch {
      return [];
    }
  }

  private normalizeIgnorePatterns(patterns: string[]): string[] {
    const result: string[] = [];

    for (const raw of patterns) {
      const trimmed = raw.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      if (trimmed.startsWith('!')) {
        // tinyglobby ignore list does not support re-includes
        continue;
      }

      const expanded = this.expandIgnorePattern(trimmed);
      result.push(...expanded);
    }

    return Array.from(new Set(result));
  }

  private expandIgnorePattern(pattern: string): string[] {
    const withoutBang = pattern.replace(/^!/, '');
    const normalized = withoutBang.replace(/^\/+/g, '');

    if (!normalized) {
      return [];
    }

    const isDirectory = normalized.endsWith('/');
    const base = isDirectory ? normalized.slice(0, -1) : normalized;
    const hasGlob = /[*?[{]/.test(base);
    const segments = base.split('/');

    if (isDirectory) {
      return [`${base}/**`, `**/${base}/**`];
    }

    if (!hasGlob && segments.length === 1) {
      if (base.includes('.')) {
        return [`**/${base}`];
      }

      return [`**/${base}`, `${base}/**`, `**/${base}/**`];
    }

    if (!hasGlob) {
      return [base, `**/${base}`, `${base}/**`];
    }

    if (!base.startsWith('**/')) {
      return [`**/${base}`];
    }

    return [base];
  }
}
