import { Module } from '@nestjs/common';
import { ConfigModule } from '../../core/config/config.module';
import { GitService } from './git.service';

@Module({
  imports: [ConfigModule],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}
