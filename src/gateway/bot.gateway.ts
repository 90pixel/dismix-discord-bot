import {
  DiscordClientProvider,
  On,
  Once,
  OnCommand,
  UseGuards,
} from 'discord-nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { Snowflake, Message, Presence, Interaction } from 'discord.js';
import { BotGuard } from '../guards/bot.guard';
import { BotService } from '../bot/bot.service';
import { LogChannelService } from '../log-channel/log-channel.service';
import * as moment from 'moment';
import * as fs from 'fs';
import { MusicSubscription } from '../music/music-subscription';
import { Track } from '../music/track';
import {
  AudioPlayerStatus,
  AudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  public subscriptions = new Map<Snowflake, MusicSubscription>();
  constructor(
    private readonly discordProvider: DiscordClientProvider,
    private readonly service: BotService,
    private readonly logChannelService: LogChannelService,
  ) {}

  @Once({ event: 'ready' })
  onReady(): void {
    this.logger.log(
      'Logged as : ' + this.discordProvider.getClient().user.username,
    );
  }

  @On({ event: 'interactionCreate' })
  async playMusic(interaction: Interaction): Promise<any> {
    if (!interaction.isCommand() || !interaction.guildId) return;
    let subscription = await this.subscriptions.get(interaction.guildId);

    if (interaction.commandName === 'play') {
      await interaction.deferReply();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/ban-ts-comment
      // @ts-ignore
      const voiceChannel = interaction.member.voice.channel;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const url = interaction.options.get('song')!.value! as string;
      if (!url.includes('http')) {
        if (interaction.deferred) {
          await interaction.deleteReply();
        }
        return;
      }

      if (!subscription) {
        subscription = new MusicSubscription(
          joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          }),
        );
        await subscription.voiceConnection.on('error', console.warn);
        await this.subscriptions.set(interaction.guildId, subscription);
      }

      try {
        await entersState(
          subscription.voiceConnection,
          VoiceConnectionStatus.Ready,
          20e3,
        );
      } catch (error) {
        return;
      }

      try {
        // Attempt to create a Track from the user's video URL
        const track = await Track.from(url, {
          onStart() {
            if (interaction.deferred) {
              interaction
                .followUp({ content: 'Now playing!', ephemeral: true })
                .catch(console.warn);
            }
          },
          onFinish() {
            if (interaction.deferred) {
              interaction
                .followUp({ content: 'Now finished!', ephemeral: true })
                .catch(console.warn);
            }
          },
          onError(error) {
            console.warn(error);
          },
        });
        // Enqueue the track and reply a success message to the user
        subscription.enqueue(track);
        if (interaction.deferred) {
          await interaction.followUp(`Enqueued **${track.title}**`);
        }
      } catch (error) {
        await interaction.reply(
          'Failed to play track, please try again later!',
        );
      }
    } else if (interaction.commandName === 'skip') {
      if (subscription) {
        // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
        // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
        // will be loaded and played.
        subscription.audioPlayer.stop();
        await interaction.reply('Skipped song!');
      } else {
        await interaction.reply('Not playing in this server!');
      }
    } else if (interaction.commandName === 'queue') {
      // Print out the current queue, including up to the next 5 tracks to be played.
      if (subscription) {
        const current =
          subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
            ? `Nothing is currently playing!`
            : `Playing **${
                (
                  subscription.audioPlayer.state
                    .resource as AudioResource<Track>
                ).metadata.title
              }**`;

        const queue = subscription.queue
          .slice(0, 5)
          .map((track, index) => `${index + 1}) ${track.title}`)
          .join('\n');

        await interaction.reply(`${current}\n\n${queue}`);
      } else {
        await interaction.reply('Not playing in this server!');
      }
    } else if (interaction.commandName === 'pause') {
      if (subscription) {
        subscription.audioPlayer.pause();
        await interaction.reply({ content: `Paused!`, ephemeral: true });
      } else {
        await interaction.reply('Not playing in this server!');
      }
    } else if (interaction.commandName === 'resume') {
      if (subscription) {
        subscription.audioPlayer.unpause();
        await interaction.reply({ content: `Unpaused!`, ephemeral: true });
      } else {
        await interaction.reply('Not playing in this server!');
      }
    } else if (interaction.commandName === 'leave') {
      if (subscription) {
        subscription.voiceConnection.destroy();
        this.subscriptions.delete(interaction.guildId);
        await interaction.reply({ content: `Left channel!`, ephemeral: true });
      } else {
        await interaction.reply('Not playing in this server!');
      }
    } else {
      await interaction.reply('Unknown command');
    }
  }

  @OnCommand({ name: 'log-channel' })
  async setLogStatusAndChannel(message: Message): Promise<void> {
    const channelId = message.content.substr('!log-channel '.length);

    let replyMessage: string;

    const guildId = message.guild.id;
    const logChannel = await this.logChannelService.findOne({
      guildId: guildId,
    });

    if (!channelId) {
      replyMessage = 'ChannelId required!';
      await message.reply({ content: `${replyMessage}` });
      return;
    }
    if (!logChannel) {
      await this.logChannelService.create({
        guildId: guildId,
        logChannelId: channelId,
        isLogActive: true,
      });

      replyMessage = 'Log channel successfully created and active!';
      await message.reply({ content: `${replyMessage}` });
      return;
    } else {
      await this.logChannelService.update(guildId, {
        logChannelId: channelId,
        isLogActive: true,
      });

      replyMessage = 'Log channel successfully updated and active!';
      await message.reply({ content: `${replyMessage}` });
      return;
    }
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'logs' })
  async setLogStatus(message: Message): Promise<void> {
    const logStatus = message.content.substr('!logs '.length);

    const guildId = message.guild.id;
    const logChannel = await this.logChannelService.findOne({
      guildId: guildId,
    });

    let isLogActive = false;
    let replyMessage = '';

    if (!logChannel) {
      await message.reply({
        content:
          'You did not created a log channel, please use !log-channel +LOGCHANNELID+ command for create one.',
      });
      return;
    }

    if (logStatus === 'passive') {
      replyMessage = 'Logs are stopped successfully.';
    } else if (logStatus === 'active') {
      isLogActive = true;
      replyMessage = 'Logs are started successfully.';
    } else {
      replyMessage = 'Please use "passive" or active "argument"';

      await message.reply({ content: `${replyMessage}` });

      return;
    }

    await this.logChannelService.update(logChannel.guildId, {
      isLogActive: isLogActive,
    });

    await message.reply({ content: `${replyMessage}` });
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'online-members' })
  async getOnlineMembers(message: Message): Promise<void> {
    const onlineMembers = await this.service.getOnlineMembers(message);
    await message.reply({ content: `Online Members: ${onlineMembers}` });
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'send-message' })
  async sendMessageToUsers(message: Message): Promise<void> {
    const mentionedUsers = message.mentions.users;
    let messageContent = message.content.substr('!send-message '.length);
    messageContent = messageContent.substr(0, messageContent.indexOf('<'));

    mentionedUsers.forEach((user) => {
      user.send({ content: messageContent });
    });
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'deploy' })
  async deployCommands(message: Message): Promise<void> {
    await message.guild.commands.set([
      {
        name: 'play',
        description: 'Plays a song',
        options: [
          {
            name: 'song',
            type: 'STRING' as const,
            description: 'The URL of the song to play',
            required: true,
          },
        ],
      },
      {
        name: 'skip',
        description: 'Skip to the next song in the queue',
      },
      {
        name: 'queue',
        description: 'See the music queue',
      },
      {
        name: 'pause',
        description: 'Pauses the song that is currently playing',
      },
      {
        name: 'resume',
        description: 'Resume playback of the current song',
      },
      {
        name: 'leave',
        description: 'Leave the voice channel',
      },
    ]);

    await message.reply('Successfully Deployed!');
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'history' })
  async getMessageHistory(message: Message): Promise<void> {
    const targetChannel = message.channel;

    const finalArray = [];

    const handleTime = (timestamp) =>
      moment(timestamp)
        .format('DD/MM/YYYY - hh:mm:ss a')
        .replace('pm', 'PM')
        .replace('am', 'AM');

    for await (const message of this.service.loadAllMessages(targetChannel)) {
      finalArray.push({
        username: `${message.author.username}`,
        timestamp: `${handleTime(message.createdTimestamp)}`,
        content: `${message.content}`,
      });
    }

    fs.writeFileSync(
      +moment().toDate().getTime() + '.json',
      JSON.stringify(finalArray),
    );

    await message.reply({
      content:
        +moment().toDate().getTime() +
        '.json' +
        ' : History file created for channel :' +
        message.channel.id,
    });

    return;
  }

  @UseGuards(BotGuard)
  @OnCommand({ name: 'offline-members' })
  async getOfflineMembers(message: Message): Promise<void> {
    const offlineMembers = await this.service.getOfflineMembers(message);

    await message.reply({ content: `Offline Members: ${offlineMembers}` });
  }

  @On({ event: 'presenceUpdate' })
  async onPresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence,
  ): Promise<void> {
    const guilds = await this.discordProvider
      .getClient()
      .guilds.cache.map((guild) => guild);

    guilds.forEach(async (guild) => {
      const loggerChannel = await this.logChannelService.findOne({
        guildId: guild.id,
      });

      if (
        loggerChannel &&
        loggerChannel.isLogActive &&
        loggerChannel.logChannelId
      ) {
        const generalChannel: any =
          guild.channels.cache.find(
            (channel) => channel.id === loggerChannel.logChannelId,
          ) || guild.channels.cache.first();

        generalChannel.send({
          content:
            '<@' +
            newPresence.userId +
            '>' +
            ':' +
            newPresence.status +
            ' : ' +
            new Date(),
        });
      }
    }, Error());
  }
}
