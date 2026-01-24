import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { Project, type SourceFile, SyntaxKind, ts } from 'ts-morph';
import { ConfigService } from '../../core/config/config.service';
import { FsService } from '../../core/file-system/fs.service';
import {
  type CleanOptions,
  type CleanSummary,
  type FileCleanReport,
} from './cleaner.types';

type RemovalRange = {
  start: number;
  end: number;
  text: string;
  kind: 'comment' | 'jsx';
};

@Injectable()
export class CleanerService {
  private readonly project = new Project({
    useInMemoryFileSystem: false,
    skipFileDependencyResolution: true,
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
    },
  });

  private readonly systemWhitelist = [
    '@ts-ignore',
    '@ts-expect-error',
    'eslint-disable',
    'prettier-ignore',
    'biome-ignore',
    'todo',
    'fixme',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly fsService: FsService,
  ) {}

  async cleanFiles(
    files: string[],
    options: CleanOptions = {},
  ): Promise<CleanSummary> {
    const config = this.configService.getConfig();
    const whitelist = this.buildWhitelist(config.cleaner.whitelist);
    let commentsRemoved = 0;
    let filesChanged = 0;
    const reports: FileCleanReport[] = [];

    for (const file of files) {
      const original = await this.fsService.readFileRelative(file);
      const result = this.cleanSource(
        file,
        original,
        whitelist,
        config.cleaner.keepJSDoc,
      );

      if (result.removed > 0) {
        filesChanged += 1;
        commentsRemoved += result.removed;

        if (!options.dryRun) {
          await this.writeFile(file, result.nextContent);
        }
      }

      reports.push({
        file,
        removed: result.removed,
        previews: result.previews,
      });
    }

    return {
      filesProcessed: files.length,
      filesChanged,
      commentsRemoved,
      reports,
    };
  }

  private cleanSource(
    file: string,
    content: string,
    whitelist: Set<string>,
    keepJSDoc: boolean,
  ): { nextContent: string; removed: number; previews: string[] } {
    const sourceFile = this.project.createSourceFile(file, content, {
      overwrite: true,
    });
    const fullText = sourceFile.getFullText();

    const ranges = this.collectCommentRanges(sourceFile);
    const candidates = ranges.filter((range) =>
      this.shouldRemove(range, whitelist, keepJSDoc),
    );

    if (candidates.length === 0) {
      return { nextContent: content, removed: 0, previews: [] };
    }

    const previews = candidates
      .slice(0, 3)
      .map((range) => this.normalizePreview(range.text));

    const sorted = [...candidates].sort((a, b) => b.start - a.start);
    let nextContent = fullText;

    for (const range of sorted) {
      const replacement = this.getReplacement(fullText, range);
      nextContent = `${nextContent.slice(0, range.start)}${replacement}${nextContent.slice(range.end)}`;
    }

    return { nextContent, removed: candidates.length, previews };
  }

  private collectCommentRanges(sourceFile: SourceFile): RemovalRange[] {
    const fullText = sourceFile.getFullText();
    const ranges = new Map<string, RemovalRange>();

    const addRanges = (items: readonly ts.CommentRange[] | undefined) => {
      if (!items) return;

      for (const item of items) {
        const key = `${item.pos}:${item.end}`;
        if (ranges.has(key)) continue;
        ranges.set(key, {
          start: item.pos,
          end: item.end,
          text: fullText.slice(item.pos, item.end),
          kind: 'comment',
        });
      }
    };

    const visit = (node: ts.Node): void => {
      addRanges(ts.getLeadingCommentRanges(fullText, node.getFullStart()));
      addRanges(ts.getTrailingCommentRanges(fullText, node.getEnd()));
      ts.forEachChild(node, visit);
    };

    visit(sourceFile.compilerNode);

    const jsxExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.JsxExpression,
    );
    for (const jsx of jsxExpressions) {
      if (jsx.getExpression()) continue;
      const text = jsx.getText();
      if (!text.includes('/*')) continue;

      const start = jsx.getPos();
      const end = jsx.getEnd();
      const key = `${start}:${end}`;

      if (!ranges.has(key)) {
        ranges.set(key, {
          start,
          end,
          text: fullText.slice(start, end),
          kind: 'jsx',
        });
      }
    }

    return [...ranges.values()];
  }

  private shouldRemove(
    range: RemovalRange,
    whitelist: Set<string>,
    keepJSDoc: boolean,
  ): boolean {
    const trimmed = range.text.trimStart();
    if (keepJSDoc && trimmed.startsWith('/**')) {
      return false;
    }

    const lower = range.text.toLowerCase();
    for (const token of whitelist) {
      if (lower.includes(token)) {
        return false;
      }
    }

    return true;
  }

  private normalizePreview(text: string): string {
    const singleLine = text.replace(/\s+/g, ' ').trim();
    if (singleLine.length <= 50) return singleLine;
    return `${singleLine.slice(0, 47)}...`;
  }

  private getReplacement(original: string, range: RemovalRange): string {
    if (range.kind === 'jsx') {
      return '';
    }

    const before = range.start > 0 ? original[range.start - 1] : '';
    const after = range.end < original.length ? original[range.end] : '';
    const isIdentifier = (ch: string): boolean => /[A-Za-z0-9_$]/.test(ch);

    if (isIdentifier(before) && isIdentifier(after)) {
      return ' ';
    }

    return '';
  }

  private buildWhitelist(userList: string[]): Set<string> {
    const normalized = userList.map((item) => item.toLowerCase());
    return new Set([...this.systemWhitelist, ...normalized]);
  }

  private async writeFile(file: string, content: string): Promise<void> {
    const absolute = path.resolve(process.cwd(), file);
    await fs.writeFile(absolute, content, 'utf8');
  }
}
