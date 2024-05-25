import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';
import { Util } from '../../../util/Util';

export const gameAddPlayerSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['add-player']
> = async ({ interaction, args, respond }) => {
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
    interaction.channelId,
    interaction,
    respond
  );

  if (!game) return;

  if (game.status !== GameStatus.SETUP) {
    return respond(interaction, {
      content:
        'This game is not accepting new players as it is not in setup mode.',
    });
  }

  if (game.createdById !== interaction.user.id) {
    return respond(interaction, {
      content:
        'You are not the owner of this game, only the owner can add players.',
    });
  }

  if (game.players.length === 20) {
    return respond(interaction, {
      content: 'This game is full, there can be no more than 20 players.',
    });
  }

  if (game.players.some((p) => p.userId === args.player.user.id)) {
    return respond(interaction, {
      content: `${args.player.user} is already in this game.`,
      allowedMentions: {},
    });
  }

  await prisma.game.addPlayerToGame(game.id, args.player.user.id);
  await interaction.channel.members.add(
    args.player.user.id,
    `Player added to game by ${Util.getDiscordUserTag(interaction.user)} (${
      interaction.user.id
    }).`
  );

  return respond(interaction, {
    content: `${args.player.user} has been added to the game.`,
    allowedMentions: {},
  });
};
