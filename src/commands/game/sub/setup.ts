import {
  ChannelType,
  ForumChannel,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { prisma } from '../../../util/prisma';
import { GameType } from '@prisma/client';

export const gameSetupSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['setup']
> = async ({ interaction, respond, args }) => {
  const gamesInServer = await prisma.game.getGames(interaction.guildId);
  // Check if there is a "tank-tactics" forum channel in the server.
  const tankTacticsChannel = await interaction.guild.channels
    .fetch()
    .then((channels) => {
      return channels.find(
        (channel) =>
          channel &&
          channel.name === 'tank-tactics' &&
          channel.type === ChannelType.GuildForum &&
          channel
            .permissionsFor(interaction.guild.members.me!)
            .has(
              new PermissionsBitField()
                .add(PermissionFlagsBits.CreatePublicThreads)
                .add(PermissionFlagsBits.ViewChannel)
                .add(PermissionFlagsBits.SendMessages)
                .add(PermissionFlagsBits.AttachFiles)
                .add(PermissionFlagsBits.EmbedLinks)
                .add(PermissionFlagsBits.ManageThreads)
            )
      ) as ForumChannel | undefined;
    });
  if (!tankTacticsChannel) {
    return respond(interaction, {
      content:
        'This server does not have a forum channel named "tank-tactics" that I do not have the required permissions in.',
      ephemeral: true,
    });
  }

  let type: GameType;

  switch (args.type) {
    case 'ffa':
      type = GameType.FFA;
      break;
    case 'hidden':
      type = GameType.HIDDEN;
      break;
    default:
      return respond(interaction, {
        content: 'Invalid game type.',
        ephemeral: true,
      });
  }

  const forumThread = await tankTacticsChannel.threads.create({
    name: `Tank Tactics Game #${gamesInServer.length + 1}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    reason: `Tank Tactics Game #${gamesInServer.length + 1}`,
    message: {
      content: `New game of Tank Tactics in the making! ${interaction.user} is setting up the game.`,
      allowedMentions: {
        users: [interaction.user.id],
      },
    },
  });

  const pointInterval = args['point-interval'] * 60e3;

  const game = await prisma.game.createSetupGame({
    guildId: interaction.guildId,
    channelId: tankTacticsChannel.id,
    threadId: forumThread.id,
    createdById: interaction.user.id,
    pointInterval,
    type,
  });

  await prisma.game.addPlayerToGame(game.id, interaction.user.id);

  return respond(interaction, {
    content: `A game in setup mode is created! You can find the game forum post here: ${forumThread.url}. Make sure to setup the game using the commands in the forum post.`,
    flags: MessageFlags.SuppressEmbeds,
  });
};
