import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { glob } from 'tinyglobby';
import { ConfigService } from '../config/config.service';

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.ico',
  '.tif',
  '.tiff',
  '.psd',
  '.ai',
  '.sketch',
  '.heic',
  '.heif',
  '.mp3',
  '.wav',
  '.flac',
  '.ogg',
  '.m4a',
  '.mp4',
  '.mkv',
  '.mov',
  '.avi',
  '.webm',
  '.wmv',
  '.flv',
  '.mpg',
  '.mpeg',
  '.ogv',
  '.zip',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.rar',
  '.7z',
  '.tar',
  '.pdf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.class',
  '.jar',
  '.war',
  '.ear',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',
  '.bin',
  '.pak',
  '.dat',
]);

const BINARY_PROBE_SIZE = 8192;

@Injectable()
export class FsService {
  constructor(private readonly configService: ConfigService) {}

  async findProjectFiles(
    options: {
      ignore?: string[];
      useGitignore?: boolean;
      excludeBinary?: boolean;
    } = {},
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

    // Convert to project-relative paths and sort
    const relativePaths = entries
      .map((entry) => path.relative(process.cwd(), entry))
      .filter((relative) => relative.length > 0)
      .sort((a, b) => a.localeCompare(b));

    // By default exclude binary files when collecting project files (so pack will skip them).
    // Consumers can override with options.excludeBinary = false.
    const excludeBinary = options.excludeBinary ?? true;
    if (!excludeBinary) {
      return relativePaths;
    }

    // Heuristic: consider a file binary if it contains a NUL byte in the first chunk.
    // Read a small chunk of each file (or the whole file if smaller) and test for 0x00.
    const textFiles: string[] = [];

    for (const rel of relativePaths) {
      if (this.isLikelyBinaryByExtension(rel)) {
        continue;
      }

      const abs = path.resolve(process.cwd(), rel);
      const containsNullByte = await this.hasNullByte(abs);

      if (!containsNullByte) {
        textFiles.push(rel);
      }
    }

    return textFiles;
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

  private isLikelyBinaryByExtension(relativePath: string): boolean {
    const ext = path.extname(relativePath).toLowerCase();
    return ext.length > 0 && BINARY_EXTENSIONS.has(ext);
  }

  private async hasNullByte(absolutePath: string): Promise<boolean> {
    let handle: fs.FileHandle | undefined;

    try {
      handle = await fs.open(absolutePath, 'r');
      const buffer = Buffer.alloc(BINARY_PROBE_SIZE);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);

      for (let i = 0; i < bytesRead; i += 1) {
        if (buffer[i] === 0) {
          return true;
        }
      }

      return false;
    } catch {
      return true;
    } finally {
      if (handle) {
        await handle.close();
      }
    }
  }
}
