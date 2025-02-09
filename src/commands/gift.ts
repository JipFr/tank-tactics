import { ChannelType } from 'discord.js';
import { GiftCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame, prisma } from '../util/prisma';
import {
  GiftAmountUnderMinimumError,
  NotEnoughPointsToSubtractError,
  PlayerDoesNotExistInGameError,
  PlayerToGiftDoesNotExistInGameError,
  PlayerToGiftIsOutOfRangeError,
  PlayerToGiftToIsDeadError,
} from '../util/errors';

export default createCommand(GiftCommand)
  .registerChatInput(async ({ interaction, respond, args }) => {
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

    if (args.receiver.user.id === interaction.user.id)
      return respond(interaction, {
        content: 'You cannot gift yourself points.',
        ephemeral: true,
      });

    try {
      await prisma.player.gift(
        game.id,
        interaction.user.id,
        args.receiver.user.id,
        args.amount
      );
    } catch (e) {
      if (e instanceof PlayerDoesNotExistInGameError) {
        return respond(interaction, {
          content: 'You are not a player in this game.',
          ephemeral: true,
        });
      }

      if (e instanceof PlayerToGiftDoesNotExistInGameError) {
        return respond(interaction, {
          content:
            'The player you are trying to gift is not a player in this game.',
          ephemeral: true,
        });
      }

      if (e instanceof NotEnoughPointsToSubtractError) {
        return respond(interaction, {
          content: 'You do not have enough points to gift that amount.',
          ephemeral: true,
        });
      }

      if (e instanceof PlayerToGiftIsOutOfRangeError) {
        return respond(interaction, {
          content: 'The player you are trying to gift is out of range.',
          ephemeral: true,
        });
      }

      if (e instanceof GiftAmountUnderMinimumError) {
        return respond(interaction, {
          content:
            'The amount you are trying to gift is under the minimum amount of 1.',
          ephemeral: true,
        });
      }
      if (e instanceof PlayerToGiftToIsDeadError) {
        return respond(interaction, {
          content: 'The player you are trying to gift to is dead.',
          ephemeral: true,
        });
      }
      throw e;
    }

    respond(interaction, {
      content: `You have gifted ${args.receiver.user} ${args.amount} points.`,
      allowedMentions: {
        users: [args.receiver.user.id],
      },
    });
  })
  .build();
