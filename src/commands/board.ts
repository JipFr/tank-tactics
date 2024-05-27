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
import { getBoardAsAttachmentBuilder } from '../util/getBoard';

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

    await respond(interaction, {
      files: [await getBoardAsAttachmentBuilder(interaction, game)],
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
