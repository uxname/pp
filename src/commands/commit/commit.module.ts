import { Module } from '@nestjs/common';
import { ConfigModule } from '../../core/config/config.module';
import { UiModule } from '../../core/ui/ui.module';
import { AiModule } from '../../shared/ai/ai.module';
import { GitModule } from '../../shared/git/git.module';
import { CommitCommand } from './commit.command';

@Module({
  imports: [ConfigModule, UiModule, GitModule, AiModule],
  providers: [CommitCommand],
})
export class CommitModule {}
