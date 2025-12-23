export interface PriorityRule {
  score: number;
  test: (
    relativePath: string,
    fileBasename: string,
    fileDirname: string,
  ) => boolean;
}

export interface FileWithScore {
  path: string;
  score: number;
  size: number;
  relativePath: string;
}

export interface OutputOptions {
  stdout?: boolean;
  output?: string;
}

export interface CommandOptions extends OutputOptions {
  gitignore: boolean;
  exclude: string[];
}

export interface Config {
  MAX_FILE_SIZE_BYTES: number;
  EXCLUDED_DIRS: Set<string>;
  EXCLUDED_FILES: Set<string>;
  EXCLUDED_PATTERNS: Set<string>;
  INCLUDED_EXTENSIONS_AND_FILENAMES: Set<string>;
}

export interface HistoryItem {
  command: string;
  timestamp: number;
}
