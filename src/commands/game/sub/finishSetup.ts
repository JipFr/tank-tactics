import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';

export const gameFinishSetupSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['finish-setup']
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

  // if not setup game, error
  if (game.status !== GameStatus.SETUP) {
    return respond(interaction, {
      content: 'This game is not in the setup phase.',
    });
  }

  // if not game owner, error
  if (game.createdById !== interaction.user.id) {
    return respond(interaction, {
      content:
        'You are not the owner of this game, the owner needs to finish the setup.',
    });
  }

  // if not enough players, error
  if (game.players.length < 2) {
    return respond(interaction, {
      content:
        'There are not enough players to start the game. You need at least 2 players.',
    });
  }

  // if game is full, error
  if (game.players.length > 20) {
    return respond(interaction, {
      content: 'The game is full. You can only have a maximum of 20 players.',
    });
  }

  await prisma.game.finishSetupGame(game.id);

  return respond(interaction, {
    content:
      'The setup phase has been finished. Make sure to start the game with the `/game start` command in the game channel.',
  });
};
