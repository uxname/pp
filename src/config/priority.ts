import type { PriorityRule } from '../types';

export const PRIORITY_RULES: PriorityRule[] = [
  {
    score: 100,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename === 'README.md' ||
      fileBasename === 'package.json' ||
      fileBasename === 'Dockerfile' ||
      fileBasename === 'docker-compose.yml' ||
      fileBasename === 'Makefile',
  },
  {
    score: 90,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.md') && !fileBasename.endsWith('CHANGELOG.md'),
  },
  {
    score: 80,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.ts') ||
      fileBasename.endsWith('.tsx') ||
      fileBasename.endsWith('.js') ||
      fileBasename.endsWith('.jsx'),
  },
  {
    score: 70,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.py') ||
      fileBasename.endsWith('.go') ||
      fileBasename.endsWith('.rs') ||
      fileBasename.endsWith('.java') ||
      fileBasename.endsWith('.kt') ||
      fileBasename.endsWith('.scala'),
  },
  {
    score: 60,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.html') ||
      fileBasename.endsWith('.css') ||
      fileBasename.endsWith('.scss') ||
      fileBasename.endsWith('.sass'),
  },
  {
    score: 50,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.json') ||
      fileBasename.endsWith('.yaml') ||
      fileBasename.endsWith('.yml') ||
      fileBasename.endsWith('.toml'),
  },
  {
    score: 10,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.includes('.test.') ||
      fileBasename.includes('.spec.') ||
      fileBasename.includes('__tests__/') ||
      relativePath.includes('/test/') ||
      relativePath.startsWith('test/'),
  },
  {
    score: 5,
    test: (relativePath: string, fileBasename: string) =>
      fileBasename.endsWith('.d.ts') ||
      fileBasename.endsWith('.min.js') ||
      fileBasename.endsWith('.bundle.js'),
  },
];
