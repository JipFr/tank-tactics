import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame, prisma } from '../../../util/prisma';

export const gameLeaveSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['leave']
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

  if (game.status !== 'STARTED')
    return respond(interaction, {
      content: 'You can not leave a game that is not running.',
    });

  const alivePlayers = game.players.filter((p) => p.lives > 0);

  const player = game.players.find((p) => p.userId === interaction.user.id)!;
  if (!player) {
    return respond(interaction, {
      content: "You are not in this game, so you can't leave.",
    });
  }

  if (player.lives <= 0)
    return respond(interaction, {
      content: 'You can not leave if you are already dead.',
    });

  if (alivePlayers.length <= 4)
    return respond(interaction, {
      content:
        'You can not leave if there are less than or equal to 4 players alive.',
    });

  await prisma.game.removePlayerFromGame(game.id, interaction.user.id);

  respond(interaction, {
    content: `You have left the game.`,
  });
};
