import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';
import { Util } from '../../../util/Util';

export const gameRemovePlayerSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['remove-player']
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
      content: 'This game is not accepting new players.',
    });
  }

  if (game.players.length === 2) {
    return respond(interaction, {
      content: 'A game needs a minimum of 2 players.',
    });
  }

  if (game.createdById !== interaction.user.id) {
    return respond(interaction, {
      content:
        'You are not the owner of this game, only the owner can remove players.',
    });
  }

  if (!game.players.some((p) => p.userId === args.player.user.id)) {
    return respond(interaction, {
      content: `${args.player.user} is not in this game.`,
      allowedMentions: {},
    });
  }

  await prisma.game.removePlayerFromGame(game.id, args.player.user.id);
  await interaction.channel.members.remove(
    args.player.user.id,
    `Player removed from game by ${Util.getDiscordUserTag(interaction.user)} (${
      interaction.user.id
    }).`
  );

  return respond(interaction, {
    content: `${args.player.user} has been removed from the game.`,
    allowedMentions: {},
  });
};
