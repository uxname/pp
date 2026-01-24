import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'debug', description: 'Debug command' })
export class DebugCommand extends CommandRunner {
  async run(inputs: string[], options: Record<string, unknown>) {
    console.log({ inputs, options });
  }
}
