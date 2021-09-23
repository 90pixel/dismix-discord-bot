import { Module } from '@nestjs/common';
import { BotGateway } from '../gateway/bot.gateway';
import { DiscordModule } from 'discord-nestjs';
import { DiscordConfigService } from '../services/discord-config-service';
import { BotMiddleware } from './bot.middleware';
import { BotService } from './bot.service';
import { LogChannelModule } from '../log-channel/log-channel.module';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    LogChannelModule,
  ],
  providers: [BotService, BotGateway, BotMiddleware],
  exports: [BotService],
})
export class BotModule {}
