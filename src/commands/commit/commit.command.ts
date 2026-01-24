import { Command, CommandRunner, Option } from 'nest-commander';
import { UiService } from '../../core/ui/ui.service';
import { AiService } from '../../shared/ai/ai.service';
import { GitService } from '../../shared/git/git.service';

type CommitOptions = {
  noAsk?: boolean;
  edit?: boolean;
};

@Command({
  name: 'commit',
  description: 'Сгенерировать и применить сообщение коммита',
})
export class CommitCommand extends CommandRunner {
  constructor(
    private readonly ui: UiService,
    private readonly git: GitService,
    private readonly ai: AiService,
  ) {
    super();
  }

  @Option({ flags: '--no-ask', description: 'Не спрашивать подтверждение' })
  parseNoAsk(): boolean {
    return true;
  }

  @Option({
    flags: '-e, --edit',
    description: 'Отредактировать перед коммитом',
  })
  parseEdit(): boolean {
    return true;
  }

  async run(_inputs: string[], options: CommitOptions = {}): Promise<void> {
    const spinner = this.ui.createSpinner({ text: 'Собираю diff...' }).start();

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

      spinner.text = 'Генерирую сообщение коммита...';
      const suggested = await this.ai.generateCommitMessage(diff);

      spinner.success('Сообщение готово');
      this.ui.log.info(`Предложение: ${suggested}`);

      let commitMessage = suggested;

      if (options.edit) {
        commitMessage = await this.ui.promptInput({
          message: 'Отредактируйте сообщение коммита',
          default: suggested,
        });
      }

      if (!options.noAsk) {
        const confirmed = await this.ui.promptConfirm({
          message: 'Сделать коммит с этим сообщением?',
          default: true,
        });

        if (!confirmed) {
          this.ui.log.warn('Коммит отменён пользователем.');
          return;
        }
      }

      const applySpinner = this.ui
        .createSpinner({ text: 'Выполняю git commit...' })
        .start();

      await this.git.commit(commitMessage);
      applySpinner.success('Коммит создан');
      this.ui.log.success(commitMessage);
    } catch (error) {
      spinner.error('Ошибка при создании коммита');
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.ui.log.error(message);
      process.exitCode = 1;
    }
  }
}
