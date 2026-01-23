import type { CommandModule } from '../core/cli';
import { infoCommand } from './info';

export const commands: CommandModule[] = [infoCommand];
