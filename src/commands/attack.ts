import { ChannelType } from 'discord.js';
import { AttackCommand } from '../interactions/commands';
import { createCommand } from '../util/Command';
import { getGame, prisma } from '../util/prisma';
import {
  PlayerDoesNotExistInGameError,
  PlayerDoesNotHavePointsToAttackError,
  PlayerIsNotAliveError,
  PlayerToAttackIsDeadError,
  PlayerToAttackIsNotInGame,
  PlayerToAttackIsOutOfRangeError,
} from '../util/errors';
import { container } from 'tsyringe';
import { GameManagement } from '../util/GameManagement';
import { GameStatus } from '@prisma/client';
import { getBoardAsAttachmentBuilder } from '../util/getBoard';

const gameManagement = container.resolve(GameManagement);

export default createCommand(AttackCommand)
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
        content: "This game is not running, you can't attack.",
        ephemeral: true,
      });
    }

    let data = { killed: false, halfPoints: 0, remainingLives: 0 };

    try {
      data = await prisma.player.attack(
        game.id,
        interaction.user.id,
        args.target.user.id
      );
    } catch (e) {
      if (e instanceof PlayerDoesNotExistInGameError) {
        return respond(interaction, {
          content: 'You are not a player in this game.',
        });
      }

      if (e instanceof PlayerIsNotAliveError) {
        return respond(interaction, {
          content: 'You are not alive.',
        });
      }

      if (e instanceof PlayerDoesNotHavePointsToAttackError) {
        return respond(interaction, {
          content: 'You do not have enough points to attack.',
        });
      }

      if (e instanceof PlayerToAttackIsNotInGame) {
        return respond(interaction, {
          content: 'The player you are trying to attack is not in this game.',
        });
      }

      if (e instanceof PlayerToAttackIsDeadError) {
        return respond(interaction, {
          content: 'The player you are trying to attack is dead.',
        });
      }

      if (e instanceof PlayerToAttackIsOutOfRangeError) {
        return respond(interaction, {
          content: 'The player you are trying to attack is out of range.',
        });
      }

      throw e;
    }

    let message = `You attacked ${args.target.user}, they have ${
      data.remainingLives
    } ${data.remainingLives > 1 ? 'lives' : 'life'} left.`;

    if (data.killed) {
      message = `You killed ${args.target.user} and took ${data.halfPoints} points.`;
    }

    await respond(interaction, {
      content: message,
      files: [await getBoardAsAttachmentBuilder(interaction, game.id)],
      allowedMentions: { users: [args.target.user.id] },
    });

    if (await gameManagement.checkIfGameIsOver(game.id)) {
      await gameManagement.handleGameOver(game.id);
    }
  })
  .build();
