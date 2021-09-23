import { Module } from '@nestjs/common';
import { LogChannelService } from './log-channel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogChannel } from './entities/log-channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogChannel])],
  providers: [LogChannelService],
  exports: [LogChannelService],
})
export class LogChannelModule {}
