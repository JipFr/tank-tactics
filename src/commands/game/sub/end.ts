import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';
import { container } from 'tsyringe';
import { GameManagement } from '../../../util/GameManagement';

const gameManagement = container.resolve(GameManagement);

export const gameEndCommand: SubcommandFunction<
  (typeof GameCommand)['options']['end']
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
    interaction.channelId,
    interaction,
    respond
  );

  if (!game) return;

  if (game.status !== GameStatus.STARTED) {
    return respond(interaction, {
      content: 'This game is not started and as such cannot be ended.',
    });
  }

  await gameManagement.forceEndGame(game.id, interaction.user.id);

  return respond(interaction, {
    content: 'Game was force-ended!',
  });
};
