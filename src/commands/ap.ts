import { APIEmbedField, ChannelType, EmbedBuilder } from 'discord.js';
import { APCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame } from '../util/prisma';
import { GameType } from '@prisma/client';

export default createCommand(APCommand)
  .registerChatInput(async ({ interaction, respond, args }) => {
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

    let points = player.points;
    if (game.type === GameType.HIDDEN && player.userId !== interaction.user.id)
      points = 0;

    const embedFields: APIEmbedField[] = [
      {
        name: 'Kills',
        value: player.kills.toString(),
        inline: true,
      },
      {
        name: 'Lives',
        value: player.lives.toString(),
        inline: true,
      },
      {
        name: 'Points (may be hidden, depending on the game type)',
        value: points.toString(),
        inline: true,
      },
      {
        name: 'Range',
        value: player.range.toString(),
        inline: true,
      },
    ];

    if (player.lives > 0) {
      embedFields.push({
        name: 'Location',
        value: `(${player.coords.x}, ${player.coords.y})`,
        inline: true,
      });
    }

    return respond(interaction, {
      embeds: [
        new EmbedBuilder()
          .setTitle(`Game info about ${user.username}`)
          .addFields(embedFields),
      ],
    });
  })
  .build();
