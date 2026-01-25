import { Command, CommandRunner, Option } from 'nest-commander';
import { ConfigService } from '../../core/config/config.service';
import { FsService } from '../../core/file-system/fs.service';
import { UiService } from '../../core/ui/ui.service';
import { CleanerService } from '../../shared/cleaner/cleaner.service';

type CleanOptions = {
  dryRun?: boolean;
};

@Command({ name: 'clean', description: 'Удалить комментарии из кода' })
export class CleanCommand extends CommandRunner {
  constructor(
    private readonly ui: UiService,
    private readonly fsService: FsService,
    private readonly cleaner: CleanerService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  @Option({
    flags: '-d, --dry-run',
    description: 'Показать, что будет удалено',
  })
  parseDryRun(): boolean {
    return true;
  }

  async run(_inputs: string[], options: CleanOptions = {}): Promise<void> {
    const spinner = this.ui
      .createSpinner({
        text: options.dryRun
          ? 'Анализ комментариев...'
          : 'Очистка комментариев...',
      })
      .start();

    try {
      const { cleaner: cleanerConfig } = this.config.getConfig();
      const allFiles = await this.fsService.findProjectFiles({
        useGitignore: cleanerConfig.useGitignore,
      });
      const targets = allFiles.filter((file) =>
        /\.(ts|tsx|js|jsx)$/i.test(file),
      );

      if (targets.length === 0) {
        spinner.stop('Нет файлов для очистки.');
        this.ui.log.warn('Нет файлов для очистки.');
        return;
      }

      const summary = await this.cleaner.cleanFiles(targets, {
        dryRun: options.dryRun,
      });

      spinner.success(options.dryRun ? 'Анализ завершен' : 'Очистка завершена');

      if (options.dryRun) {
        this.ui.log.info(
          `Будет затронуто файлов: ${summary.filesChanged}, комментариев: ${summary.commentsRemoved}`,
        );
        summary.reports
          .filter((report) => report.removed > 0)
          .forEach((report) => {
            const previews = report.previews
              .map((item) => `"${item}"`)
              .join(', ');
            this.ui.log.info(
              `- ${report.file} (${report.removed}): ${previews}`,
            );
          });
        return;
      }

      this.ui.log.success(
        `Очищено файлов: ${summary.filesChanged}, удалено комментариев: ${summary.commentsRemoved}`,
      );
    } catch (error) {
      spinner.error('Ошибка при очистке');
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.ui.log.error(message);
      process.exitCode = 1;
    }
  }
}
