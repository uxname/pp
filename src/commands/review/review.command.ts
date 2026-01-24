import clipboard from 'clipboardy';
import { Command, CommandRunner, Option } from 'nest-commander';
import { UiService } from '../../core/ui/ui.service';
import { AiService, type ReviewMode } from '../../shared/ai/ai.service';
import { GitService } from '../../shared/git/git.service';
import { TokenizerService } from '../../shared/tokenizer/tokenizer.service';

type ReviewOptions = {
  mode?: ReviewMode;
  copy?: boolean;
  json?: boolean;
};

const DEFAULT_MODE: ReviewMode = 'bug';

@Command({
  name: 'review',
  description: 'AI ревью для застейдженных изменений',
})
export class ReviewCommand extends CommandRunner {
  constructor(
    private readonly ui: UiService,
    private readonly git: GitService,
    private readonly tokenizer: TokenizerService,
    private readonly ai: AiService,
  ) {
    super();
  }

  @Option({
    flags: '-m, --mode <mode>',
    description: 'Режим проверки: bug | style | security',
  })
  parseMode(value: string): ReviewMode {
    if (value === 'bug' || value === 'style' || value === 'security') {
      return value;
    }
    return DEFAULT_MODE;
  }

  @Option({ flags: '-c, --copy', description: 'Скопировать результат в буфер' })
  parseCopy(): boolean {
    return true;
  }

  @Option({
    flags: '--json',
    description: 'Вернуть JSON (структурированный вывод)',
  })
  parseJson(): boolean {
    return true;
  }

  async run(_inputs: string[], options: ReviewOptions = {}): Promise<void> {
    const spinner = this.ui
      .createSpinner({ text: 'Собираю diff из git...' })
      .start();

    try {
      await this.git.ensureRepo();

      const hasStaged = await this.git.hasStagedChanges();
      if (!hasStaged) {
        spinner.stop('Нет застейдженных изменений');
        this.ui.log.warn('Сначала выполните git add для нужных файлов.');
        return;
      }

      const diff = await this.git.getStagedDiff();
      if (!diff.trim()) {
        spinner.stop('Diff пуст — возможно, всё исключено packer.ignore');
        this.ui.log.warn(
          'Diff пустой: все изменения попали в исключения packer.ignore.',
        );
        return;
      }

      const tokens = this.tokenizer.count(diff);
      const warningBudget = 12000;
      if (tokens.tokens > warningBudget) {
        this.ui.log.warn(
          `Большой контекст (${tokens.tokens} токенов, ~$${tokens.usdEstimate.toFixed(2)}). Ревью может стоить дороже.`,
        );
      }

      spinner.text = 'Запрос к AI...';
      const mode = options.mode ?? DEFAULT_MODE;
      const result = await this.ai.reviewDiff(
        diff,
        mode,
        Boolean(options.json),
      );

      spinner.success('Ревью готово');

      if (options.json && result.structured) {
        this.renderStructured(result.structured);
        if (options.copy) {
          await clipboard.write(JSON.stringify(result.structured, null, 2));
          this.ui.log.success('JSON скопирован в буфер обмена');
        }
        return;
      }

      if (options.json && !result.structured) {
        this.ui.log.warn(
          'Структурированный вывод недоступен, показываю текст.',
        );
      }

      console.log(result.text);

      if (options.copy) {
        await clipboard.write(result.text);
        this.ui.log.success('Результат скопирован в буфер обмена');
      }
    } catch (error) {
      spinner.error('Ошибка ревью');
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.ui.log.error(message);
      process.exitCode = 1;
    }
  }

  private renderStructured(result: {
    summary: string;
    issues: Array<{
      severity: string;
      file?: string;
      line?: number;
      message: string;
    }>;
  }): void {
    this.ui.log.info(`Итог: ${result.summary}`);
    if (!result.issues.length) {
      this.ui.log.success('Критичных проблем не найдено.');
      return;
    }

    result.issues.forEach((issue) => {
      const location = [issue.file, issue.line ? `:${issue.line}` : '']
        .filter(Boolean)
        .join('');
      console.log(
        `- [${issue.severity}] ${location ? `${location} ` : ''}${issue.message}`,
      );
    });
  }
}
