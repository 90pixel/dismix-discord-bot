import { Injectable } from '@nestjs/common';
import { Message } from 'discord.js';

@Injectable()
export class BotService {
  async getOnlineMembers(message: Message) {
    let onlineMembers = '';

    const filteredMembers = await message.guild.members.cache.filter(
      (member) => member.presence.status !== 'offline',
    );

    filteredMembers.forEach((value) => {
      onlineMembers = onlineMembers + '-' + '<@' + value.user.id + '>' + '-';
    });

    return onlineMembers;
  }

  async getOfflineMembers(message: Message) {
    let offlineMembers = '';

    const filteredMembers = await message.guild.members.cache.filter(
      (member) => member.presence.status !== 'online',
    );

    filteredMembers.forEach((value) => {
      offlineMembers = offlineMembers + '-' + '<@' + value.user.id + '>' + '-';
    });

    return offlineMembers;
  }

  async *messagesIterator(channel) {
    let before = null;
    let done = false;
    while (!done) {
      const messages = await channel.messages.fetch({ limit: 100, before });
      if (messages.size > 0) {
        before = messages.lastKey();
        yield messages;
      } else done = true;
    }
  }

  async *loadAllMessages(channel) {
    for await (const messages of this.messagesIterator(channel)) {
      for (const message of messages.values()) yield message;
    }
  }
}
