import { DiscordGuard } from 'discord-nestjs';
import { ClientEvents } from 'discord.js';

export class BotGuard implements DiscordGuard {
  async canActive(
    event: keyof ClientEvents,
    [context]: [any],
  ): Promise<boolean> {
    if (context.author.id === process.env.AUTHOR_ID) {
      return true;
    }
  }
}
