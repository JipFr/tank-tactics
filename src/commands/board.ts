import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from 'discord.js';
import { BoardCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame } from '../util/prisma';
import { gameImageGenerator } from '../util/canvas';
import { GameType } from '@prisma/client';

export default createCommand(BoardCommand)
  .registerChatInput(async ({ interaction, respond }) => {
    await interaction.deferReply({ ephemeral: true });
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
    // Fetch them all from Discord
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

    const board = await gameImageGenerator({
      players,
      height: game.height,
      width: game.width,
    });

    await respond(interaction, {
      files: [
        new AttachmentBuilder(board, {
          name: `board-${game.id}.png`,
          description:
            'The board for the Tank Tactics game in this forum post.',
        }),
      ],
      ...(game.type !== GameType.HIDDEN
        ? {
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setLabel('View AP')
                  .setCustomId(`view_ap|${game.id}`)
                  .setStyle(ButtonStyle.Secondary)
              ),
            ],
          }
        : {}),
    });
  })
  .build();
