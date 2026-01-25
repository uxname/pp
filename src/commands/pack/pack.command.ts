import { promises as fs } from 'node:fs';
import path from 'node:path';
import clipboard from 'clipboardy';
import { Command, CommandRunner, Option } from 'nest-commander';
import { ConfigService } from '../../core/config/config.service';
import { PromptService } from '../../core/config/prompt.service';
import { FsService } from '../../core/file-system/fs.service';
import { UiService } from '../../core/ui/ui.service';
import { TokenizerService } from '../../shared/tokenizer/tokenizer.service';

type PackOptions = {
  copy?: boolean;
  template?: string;
  out?: string;
};

type TemplateContext = {
  context: string;
  fileList: string;
  tokenCount: number;
  usdEstimate: number;
};

@Command({ name: 'pack', description: 'Собрать контекст проекта в один файл' })
export class PackCommand extends CommandRunner {
  constructor(
    private readonly ui: UiService,
    private readonly configService: ConfigService,
    private readonly promptService: PromptService,
    private readonly fsService: FsService,
    private readonly tokenizer: TokenizerService,
  ) {
    super();
  }

  @Option({ flags: '-c, --copy', description: 'Скопировать результат в буфер' })
  parseCopy(): boolean {
    return true;
  }

  @Option({
    flags: '-t, --template <name>',
    description: 'Имя шаблона из .kodu/prompts',
  })
  parseTemplate(value: string): string {
    return value;
  }

  @Option({
    flags: '-o, --out <path>',
    description: 'Путь для сохранения результата',
  })
  parseOut(value: string): string {
    return value;
  }

  async run(_inputs: string[], options: PackOptions): Promise<void> {
    const spinner = this.ui.createSpinner({ text: 'Сбор файлов...' }).start();

    try {
      const files = await this.fsService.findProjectFiles();

      if (files.length === 0) {
        spinner.stop('Нет файлов для упаковки.');
        this.ui.log.warn('Нет файлов для упаковки.');
        return;
      }

      const context = await this.buildContext(files);
      const fileList = files.join('\n');
      const { tokens, usdEstimate } = this.tokenizer.count(context);

      const basePrompt = await this.applyConfiguredPrompt({
        context,
        fileList,
        tokenCount: tokens,
        usdEstimate,
      });

      const templateApplied = options.template
        ? await this.applyTemplate(options.template, {
            context,
            fileList,
            tokenCount: tokens,
            usdEstimate,
          })
        : basePrompt;

      const outputPath = await this.writeOutput(templateApplied, options.out);

      if (options.copy) {
        await clipboard.write(templateApplied);
      }

      spinner.success('Сбор завершен');
      this.ui.log.info(`Файлов: ${files.length}`);
      this.ui.log.info(`Токены: ${tokens}`);
      this.ui.log.info(`Оценка стоимости: ~$${usdEstimate.toFixed(4)}`);
      this.ui.log.success(`Сохранено в ${outputPath}`);

      if (options.copy) {
        this.ui.log.success('Результат скопирован в буфер обмена');
      }
    } catch (error) {
      spinner.error('Ошибка при сборке контекста');
      const message =
        error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.ui.log.error(message);
      process.exitCode = 1;
    }
  }

  private async buildContext(files: string[]): Promise<string> {
    const chunks = await Promise.all(
      files.map(async (file) => {
        const content = await this.fsService.readFileRelative(file);
        return `// file: ${file}\n${content}`;
      }),
    );

    return chunks.join('\n\n');
  }

  private async applyTemplate(
    name: string,
    ctx: TemplateContext,
  ): Promise<string> {
    const template = await this.loadTemplate(name);
    return this.fillTemplate(template, ctx);
  }

  private async loadTemplate(name: string): Promise<string> {
    return this.promptService.loadFromPromptsDir(name);
  }

  private async writeOutput(
    content: string,
    outPath?: string,
  ): Promise<string> {
    const target = outPath ?? path.join(process.cwd(), '.kodu', 'context.txt');
    const dir = path.dirname(target);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(target, `${content}\n`, 'utf8');
    return target;
  }

  private async applyConfiguredPrompt(ctx: TemplateContext): Promise<string> {
    const config = this.configService.getConfig();
    const packPrompt = config.prompts?.pack;

    if (!packPrompt) {
      return ctx.context;
    }

    const template = await this.promptService.load(packPrompt);
    return this.fillTemplate(template, ctx);
  }

  private fillTemplate(template: string, ctx: TemplateContext): string {
    const filled = template
      .replace(/\{\{context\}\}/g, ctx.context)
      .replace(/\{\{fileList\}\}/g, ctx.fileList)
      .replace(/\{\{tokenCount\}\}/g, ctx.tokenCount.toString())
      .replace(/\{\{usdEstimate\}\}/g, ctx.usdEstimate.toFixed(4));

    if (!template.includes('{{context}}')) {
      return `${filled}\n\n${ctx.context}`;
    }

    return filled;
  }
}
