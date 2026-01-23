import type { CommandModule } from '../core/cli';
import { printScaffoldStatus } from '../core/cli';

export const infoCommand: CommandModule = {
  register(program) {
    program
      .command('info')
      .description('Show the current scaffold status')
      .action(printScaffoldStatus);
  },
};
