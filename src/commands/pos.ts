import { ChannelType } from 'discord.js';
import { PosCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame } from '../util/prisma';

export default createCommand(PosCommand)
  .registerChatInput(async ({ interaction, args, respond }) => {
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

    const user = args.user?.user ?? interaction.user;

    const player = game.players.find((p) => p.userId === user.id);

    if (!player)
      return respond(interaction, {
        content:
          user.id === interaction.user.id
            ? 'You are not in this game.'
            : 'This user is not in this game.',
      });

    return respond(interaction, {
      content: `**X**: ${player.coords.x}\n**Y**: ${player.coords.y}`,
    });
  })
  .build();
