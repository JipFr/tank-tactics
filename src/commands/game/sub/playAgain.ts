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
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';

export const gamePlayAgainSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['play-again']
> = async ({ interaction, respond }) => {
  if (
    !(
      interaction.channel?.isThread() &&
      interaction.channel.parent?.type === ChannelType.GuildForum
    )
  )
    return respond(interaction, {
      content: 'This command can only be used in a forum post.',
    });
  const game = await getGame(
    interaction.channel.parent.id,
    interaction.channel.id,
    interaction,
    respond
  );
  if (!game) return;

  if (game.status === GameStatus.SETUP || game.status === GameStatus.STARTING)
    return respond(interaction, {
      content:
        "You cannot create a copy of a game that is setup mode or hasn't started.",
    });

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

  const forumThread = await tankTacticsChannel.threads.create({
    name: `Tank Tactics Game #${gamesInServer.length + 1}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    reason: `Tank Tactics Game #${gamesInServer.length + 1}`,
    message: {
      content: `New Tank Tactics game created!\n\nPlayers: ${game.players
        .map((player) => `<@${player.userId}>`)
        .join(', ')}.`,
      allowedMentions: {
        users: game.players.map((player) => player.userId),
      },
    },
  });
  await prisma.game.createGame({
    guildId: interaction.guildId,
    channelId: tankTacticsChannel.id,
    threadId: forumThread.id,
    createdById: interaction.user.id,
    players: game.players.map((player) => ({ userId: player.userId })),
    pointInterval: game.pointInterval,
    type: game.type,
  });
  return respond(interaction, {
    content: `New game created! You can find the game forum post here: ${forumThread.url}. Make sure to configure the game using the commands in the game forum post.`,
    flags: MessageFlags.SuppressEmbeds,
  });
};
