import { MessageAttachment } from 'discord.js';
import { Command } from '../types';
import { componentProps, gameCheck } from '../utils';

export const commandData = {
  name: 'ap',
  description: 'Get your game info',
} as const;

export const executeCommand: Command = async ({ interaction, game, player }) => {
  const check = gameCheck({ game, player });
  if (check) return interaction.reply(check);
  await interaction.reply({
    content: `**Kills**: ${player.kills} - **Lives**: ${player.lives} - **Points**: ${player.points} - **Range**: ${player.range}`,
    files: [new MessageAttachment(game.boardImageBuffer, 'board.png')],
    components: componentProps,
    ephemeral: true
  })
}
