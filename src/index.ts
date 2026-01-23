#!/usr/bin/env node

import { program } from 'commander';
import pkg from '../package.json';

function main() {
  program
    .name('kodu')
    .version(pkg.version)
    .description('Scaffolded kodu CLI ready for a full rewrite.');

  program
    .command('info')
    .description('Show the current scaffold status')
    .action(() => {
      console.log('kodu is currently an infrastructure-only scaffold.');
      console.log(
        'Add commands under src/commands when the new behavior is ready.',
      );
    });

  program.action(() => {
    console.log('The kodu CLI is a placeholder. Run `kodu info` for status.');
  });

  program.parse(process.argv);
}

main();
