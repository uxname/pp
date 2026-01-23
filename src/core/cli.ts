import { Command } from 'commander';
import pkg from '../../package.json';

export type CommandModule = {
  register(program: Command): void;
};

export function printScaffoldStatus() {
  console.log('kodu is currently an infrastructure-only scaffold.');
  console.log(
    'Add commands under src/commands when the new behavior is ready.',
  );
}

export function runCli(argv: string[], commands: CommandModule[]) {
  const program = new Command();

  program
    .name('kodu')
    .version(pkg.version)
    .description('Scaffolded kodu CLI ready for a full rewrite.');

  commands.forEach((command) => {
    command.register(program);
  });

  program.action(() => {
    printScaffoldStatus();
  });

  program.parse(argv);
}
