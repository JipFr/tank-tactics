import { ChannelType } from 'discord.js';
import { RangeCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame, prisma } from '../util/prisma';
import { getBoardAsAttachmentBuilder } from '../util/getBoard';
import { GameStatus } from '@prisma/client';

export default createCommand(RangeCommand)
  .registerChatInput(async ({ interaction, respond }) => {
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
        content: "This game is not running, you can't increase your range.",
        ephemeral: true,
      });
    }

    const player = game.players.find((p) => p.userId === interaction.user.id);

    if (!player)
      return respond(interaction, {
        content: 'You are not a player in this game.',
      });

    if (player.points < 1)
      return respond(interaction, {
        content: 'You do not have enough points to use this command.',
      });

    await prisma.player.increaseRange(game.id, interaction.user.id);

    respond(interaction, {
      content: `You have increased your range to ${player.range + 1}.`,
      files: [await getBoardAsAttachmentBuilder(interaction, game.id)],
    });
  })
  .build();
