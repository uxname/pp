import { Module } from '@nestjs/common';
import { ConfigModule } from '../../core/config/config.module';
import { UiModule } from '../../core/ui/ui.module';
import { AiModule } from '../../shared/ai/ai.module';
import { GitModule } from '../../shared/git/git.module';
import { TokenizerModule } from '../../shared/tokenizer/tokenizer.module';
import { ReviewCommand } from './review.command';

@Module({
  imports: [ConfigModule, UiModule, GitModule, TokenizerModule, AiModule],
  providers: [ReviewCommand],
})
export class ReviewModule {}
