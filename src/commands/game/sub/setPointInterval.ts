import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';

export const gameSetPointIntervalCommand: SubcommandFunction<
  (typeof GameCommand)['options']['set-point-interval']
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
        "You can't change the point interval of a game that is not in setup mode.",
    });
  }

  if (game.createdById !== interaction.user.id) {
    return respond(interaction, {
      content:
        'You are not the owner of this game, only the owner can change the point interval of the game.',
    });
  }

  const pointInterval = args['point-interval'] * 60e3;

  await prisma.game.setPointInterval(game.id, pointInterval);

  return respond(interaction, {
    content: `The point interval has been set to ${args['point-interval']} minutes.`,
  });
};
