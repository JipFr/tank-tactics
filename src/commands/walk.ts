import { ChannelType } from 'discord.js';
import { WalkCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame, prisma } from '../util/prisma';
import {
  InvalidDirectionError,
  NotEnoughPointsToWalkThatFarError,
  PlayerDoesNotExistInGameError,
} from '../util/errors';
import { getBoardAsAttachmentBuilder } from '../util/getBoard';
import { GameStatus } from '@prisma/client';

export default createCommand(WalkCommand)
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

    if (game.status !== GameStatus.STARTED) {
      return respond(interaction, {
        content: "This game is not running, you can't walk.",
        ephemeral: true,
      });
    }

    let takenSteps = 0;

    try {
      takenSteps = await prisma.player.walk(
        game.id,
        interaction.user.id,
        args.direction,
        args.amount
      );
    } catch (e) {
      if (e instanceof PlayerDoesNotExistInGameError) {
        return respond(interaction, {
          content: 'You are not a player in this game.',
        });
      }

      if (e instanceof NotEnoughPointsToWalkThatFarError) {
        return respond(interaction, {
          content: 'You do not have enough points to walk that far.',
        });
      }

      if (e instanceof InvalidDirectionError) {
        return respond(interaction, {
          content: 'That is not a valid direction.',
        });
      }
      throw e;
    }

    if (takenSteps === 0) {
      return respond(interaction, {
        content: 'You cannot walk that way.',
      });
    }

    if (takenSteps < args.amount) {
      return respond(interaction, {
        content: `We could only let you move ${takenSteps} steps towards the chosen direction.`,
        files: [await getBoardAsAttachmentBuilder(interaction, game.id)],
      });
    }

    return respond(interaction, {
      content: `You walked ${takenSteps} steps towards the chosen direction.`,
      files: [await getBoardAsAttachmentBuilder(interaction, game.id)],
    });
  })
  .build();
