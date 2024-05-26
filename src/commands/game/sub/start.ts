import { ChannelType } from 'discord.js';
import { GameCommand } from '../../../interactions/commands';
import { SubcommandFunction } from '../../../util/Command';
import { getGame } from '../../../util/prisma';
import { GameStatus } from '@prisma/client';
import { container } from 'tsyringe';
import { GameManagement } from '../../../util/GameManagement';

const gameManagement = container.resolve(GameManagement);

export const gameStartSubCommand: SubcommandFunction<
  (typeof GameCommand)['options']['start']
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

  if (game.status !== GameStatus.STARTING) {
    return respond(interaction, {
      content: 'This game is not starting and as such cannot be started.',
    });
  }

  if (game.players.length < 2) {
    return respond(interaction, {
      content: 'A game needs a minimum of 2 players to start.',
    });
  }

  await gameManagement.startGame(game);

  await respond(interaction, {
    content: `Starting the game!`,
    ephemeral: true,
  });

  await interaction.channel.send({
    content: `Game started!\n${game.players
      .map((p) => `<@${p.userId}>`)
      .join(' ')}`,
    allowedMentions: {
      users: game.players.map((p) => p.userId),
      repliedUser: true,
    },
  });
};
