import { Module } from '@nestjs/common';
import { DebugCommand } from './debug/debug.command';

@Module({
  imports: [],
  controllers: [],
  providers: [DebugCommand],
})
export class AppModule {}
