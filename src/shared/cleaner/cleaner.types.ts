export type CleanOptions = {
  dryRun?: boolean;
};

export type FileCleanReport = {
  file: string;
  removed: number;
  previews: string[];
};

export type CleanSummary = {
  filesProcessed: number;
  filesChanged: number;
  commentsRemoved: number;
  reports: FileCleanReport[];
};
