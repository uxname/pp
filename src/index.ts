#!/usr/bin/env node

import { commands } from './commands';
import { runCli } from './core/cli';

runCli(process.argv, commands);
