import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus, GameType } from '@prisma/client';

export const gameSetTypeCommand: SubcommandFunction<
  (typeof GameCommand)['options']['set-type']
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
      content: "You can't change the type of a game that is not in setup mode.",
    });
  }

  if (game.createdById !== interaction.user.id) {
    return respond(interaction, {
      content:
        'You are not the owner of this game, only the owner can change the type of the game.',
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

  await prisma.game.setGameType(game.id, type);

  return respond(interaction, {
    content: `The game type has been set to ${args.type}.`,
  });
};
