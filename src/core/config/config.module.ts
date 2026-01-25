import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { PromptService } from './prompt.service';

@Global()
@Module({
  providers: [ConfigService, PromptService],
  exports: [ConfigService, PromptService],
})
export class ConfigModule {}
