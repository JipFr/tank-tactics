import { AttachmentBuilder, BaseInteraction } from 'discord.js';
import { prisma } from './prisma';
import { gameImageGenerator } from './canvas';

export async function getBoard(
  interaction: BaseInteraction<'cached'>,
  gameId: string
) {
  const game = await prisma.game.getGame(gameId);

  const discordMembers = await interaction.guild.members.fetch({
    user: game.players.map((p) => p.userId),
  });

  const players = discordMembers.map((member) => {
    const gamePlayer = game.players.find((p) => p.userId === member.id)!;
    return {
      userId: member.id,
      avatarUrl: member.displayAvatarURL({ size: 32, extension: 'png' }),
      color: gamePlayer.color,
      lives: gamePlayer.lives,
      range: gamePlayer.range,
      x: gamePlayer.coords.x,
      y: gamePlayer.coords.y,
    };
  });

  return gameImageGenerator({
    players,
    height: game.height,
    width: game.width,
  });
}

export async function getBoardAsAttachmentBuilder(
  interaction: BaseInteraction<'cached'>,
  gameId: string
) {
  const board = await getBoard(interaction, gameId);

  return new AttachmentBuilder(board, {
    name: `board-${gameId}.png`,
    description: 'The board for the Tank Tactics game in this forum post.',
  });
}
