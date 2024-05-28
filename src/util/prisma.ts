import {
  GameStatus,
  GameType,
  LogType,
  Prisma,
  PrismaClient,
  Team,
} from '@prisma/client';
import { colors } from './colors';
import {
  GameIsNotStartedError,
  GameNotFoundError,
  GameNotInSetupModeError,
  GameNotInStartingModeError,
  GiftAmountUnderMinimumError,
  InvalidDirectionError,
  NoLivesLeftError,
  NotEnoughPointsToIncreaseRangeError,
  NotEnoughPointsToSubtractError,
  NotEnoughPointsToWalkThatFarError,
  PlayerDoesNotExistInGameError,
  PlayerDoesNotHavePointsToAttackError,
  PlayerIsAlreadyInGameError,
  PlayerIsNotAliveError,
  PlayerToAttackIsDeadError,
  PlayerToAttackIsNotInGame,
  PlayerToAttackIsOutOfRangeError,
  PlayerToGiftDoesNotExistInGameError,
  PlayerToGiftIsOutOfRangeError,
  PlayerToGiftToIsDeadError,
} from './errors';
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';
import { RespondFunction } from './Command';

export const boringPrisma = new PrismaClient();

export type Direction =
  | 'up-left'
  | 'up'
  | 'up-right'
  | 'right'
  | 'down-right'
  | 'down'
  | 'down-left'
  | 'left';

export const prisma = boringPrisma.$extends({
  name: 'TankTacticsModelExtension',

  model: {
    player: {
      /**
       * This will let the user walk in a direction, this will return the amount of steps taken.
       * @param gameId  The game to walk in
       * @param userId  The user to walk
       * @param direction The direction to walk in
       * @param stepAmount The amount of steps to take, defaults to 1
       * @returns The amount of steps taken
       * @throws If the player doesn't exist in the game
       * @throws If the player doesn't have enough points to walk that far
       */
      async walk(
        gameId: string,
        userId: string,
        direction: Direction,
        stepAmount = 1
      ) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId, gameId } },
          select: {
            id: true,
            coords: { select: { x: true, y: true } },
            game: {
              select: {
                width: true,
                height: true,
                players: {
                  select: {
                    coords: { select: { x: true, y: true } },
                    lives: true,
                  },
                },
              },
            },
            points: true,
          },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (!player.game) {
          throw new GameNotFoundError();
        }

        if (player.points < stepAmount) {
          throw new NotEnoughPointsToWalkThatFarError();
        }

        let position = { ...player.coords };

        let takenSteps = 0;

        let previousX = player.coords.x;
        let previousY = player.coords.y;
        while (takenSteps < stepAmount) {
          switch (direction) {
            case 'up':
              position.y--;
              break;

            case 'up-right':
              position.x++;
              position.y--;
              break;

            case 'right':
              position.x++;
              break;

            case 'down-right':
              position.x++;
              position.y++;
              break;

            case 'down':
              position.y++;
              break;

            case 'down-left':
              position.x--;
              position.y++;
              break;

            case 'left':
              position.x--;
              break;

            case 'up-left':
              position.x--;
              position.y--;
              break;

            default:
              throw new InvalidDirectionError();
          }

          if (
            position.x < 0 ||
            position.x >= player.game.width ||
            position.y < 0 ||
            position.y >= player.game.height ||
            player.game.players
              .filter((player) => player.lives > 0)
              .some(
                (player) =>
                  player.coords.x === position.x &&
                  player.coords.y === position.y
              )
          ) {
            break;
          }

          takenSteps++;

          await boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.WALK,
              data: JSON.stringify({
                player: userId,
                direction,
                oldX: previousX,
                oldY: previousY,
                newX: position.x,
                newY: position.y,
              }),
            },
          });
          previousX = position.x;
          previousY = position.y;
        }

        if (takenSteps > 0) {
          await boringPrisma.player.update({
            where: { id: player.id },
            data: {
              coords: { update: { x: position.x, y: position.y } },
              points: { decrement: takenSteps },
            },
          });
        }

        return takenSteps;
      },

      /**
       * This will increase the range of a player, this will return the new range.
       * @param gameId The game to increase the range in
       * @param userId The player to increase the range of
       * @returns The new range
       * @throws If the player doesn't exist in the game
       */
      async increaseRange(gameId: string, userId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { id: true, range: true, points: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (player.points < 1) {
          throw new NotEnoughPointsToIncreaseRangeError();
        }

        await boringPrisma.$transaction([
          boringPrisma.player.update({
            where: { id: player.id },
            data: { range: { increment: 1 }, points: { decrement: 2 } },
          }),
          boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.RANGE_INCREASE,
              data: JSON.stringify({
                player: userId,
                oldRange: player.range,
                newRange: player.range + 1,
              }),
            },
          }),
        ]);
      },

      /**
       * This will add points to a player, this will return the new amount of points.
       * @param gameId The game to add points in
       * @param userId The player to add points to
       * @param points  The amount of points to add
       * @returns The new amount of points
       * @throws If the player doesn't exist in the game
       */
      async pointsAdd(gameId: string, userId: string, points: number) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { id: true, points: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        await boringPrisma.$transaction([
          boringPrisma.player.update({
            where: { id: player.id },
            data: { points: { increment: points } },
          }),

          boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.POINT_ADD,
              data: JSON.stringify({
                player: userId,
                oldPoints: player.points,
                newPoints: player.points + points,
              }),
            },
          }),
        ]);

        return player.points + points;
      },

      /**
       * This will subtract points from a player, this will return the new amount of points.
       * @param gameId The game to subtract points in
       * @param userId The player to subtract points from
       * @param points  The amount of points to subtract
       * @returns The new amount of points
       * @throws If the player doesn't have enough points
       * @throws If the player doesn't exist in the game
       */
      async pointsSubtract(gameId: string, userId: string, points: number) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { id: true, points: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (player.points < points) {
          throw new NotEnoughPointsToSubtractError();
        }

        await boringPrisma.$transaction([
          boringPrisma.player.update({
            where: { id: player.id },
            data: { points: { decrement: points } },
          }),

          boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.POINT_SUBTRACT,
              data: JSON.stringify({
                player: userId,
                oldPoints: player.points,
                newPoints: player.points - points,
              }),
            },
          }),
        ]);

        return player.points - points;
      },

      /**
       * This will add a life to a player, this will return the new amount of lives.
       * @param gameId The game to add a life in
       * @param userId The player to add a life to
       * @returns The new amount of lives
       * @throws If the player doesn't exist in the game
       */
      async addLife(gameId: string, userId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { id: true, lives: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        await boringPrisma.$transaction([
          boringPrisma.player.update({
            where: { id: player.id },
            data: { lives: { increment: 1 } },
          }),
          boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.LIFE_ADD,
              data: JSON.stringify({
                player: userId,
                oldLives: player.lives,
                newLives: player.lives + 1,
              }),
            },
          }),
        ]);

        return player.lives + 1;
      },

      /**
       * This will remove a life from a player, this will return the new amount of lives.
       * @param gameId The game to remove a life in
       * @param userId The player to remove a life from
       * @returns The new amount of lives
       * @throws If the player doesn't have any lives left
       * @throws If the player doesn't exist in the game
       */
      async removeLife(gameId: string, userId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { id: true, lives: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (player.lives < 1) {
          throw new NoLivesLeftError();
        }

        await boringPrisma.$transaction([
          boringPrisma.player.update({
            where: { id: player.id },
            data: { lives: { decrement: 1 } },
          }),

          boringPrisma.log.create({
            data: {
              gameId,
              type: LogType.LIFE_REMOVE,
              data: JSON.stringify({
                player: userId,
                oldLives: player.lives,
                newLives: player.lives - 1,
              }),
            },
          }),
        ]);

        return player.lives - 1;
      },

      /**
       * Use this when you want to gift points to another player.
       * @param gameId The game to gift in
       * @param userId  The player to gift with
       * @param toGiftToUserId  The player to gift to
       * @param giftAmount The amount of points to gift
       * @throws If the player doesn't exist in the game
       * @throws If the player to gift to doesn't exist in the game
       * @throws If the player to gift to is out of range, unless the player that is gifting is dead
       */
      async gift(
        gameId: string,
        userId: string,
        toGiftToUserId: string,
        giftAmount: number
      ) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: {
            id: true,
            coords: { select: { x: true, y: true } },
            range: true,
            lives: true,
            points: true,
          },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        const toGiftToPlayer = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: toGiftToUserId, gameId } },
          select: {
            id: true,
            coords: { select: { x: true, y: true } },
            lives: true,
          },
        });

        if (!toGiftToPlayer) {
          throw new PlayerToGiftDoesNotExistInGameError();
        }

        if (player.points <= 0) {
          throw new NotEnoughPointsToSubtractError();
        }

        if (giftAmount < 1) {
          throw new GiftAmountUnderMinimumError();
        }

        const playersInRange = await prisma.player.getPlayersInRange(
          gameId,
          userId
        );

        if (toGiftToPlayer.lives < 1) {
          throw new PlayerToGiftToIsDeadError();
        }

        if (
          !playersInRange.some((player) => player.id === toGiftToPlayer.id) &&
          player.lives > 0
        ) {
          throw new PlayerToGiftIsOutOfRangeError();
        }

        await prisma.$transaction(async (transaction) => {
          await transaction.player.pointsSubtract(gameId, userId, giftAmount);
          await transaction.player.pointsAdd(
            gameId,
            toGiftToUserId,
            giftAmount
          );
          await transaction.log.create({
            data: {
              gameId,
              type: LogType.GIFT,
              data: JSON.stringify({
                player: userId,
                toGiftToPlayer: toGiftToUserId,
                giftAmount,
              }),
            },
          });
        });
      },

      /**
       * Use this when you want to attack another player, this will either remove a life or kill the player if they have one life left.
       * @param gameId The game to attack in
       * @param userId The player to attack with
       * @param toAttackUserId The player to attack
       * @throws If the player doesn't exist in the game
       * @throws If the player is not alive (has no lives left)
       * @throws If the player has less then 1 point
       * @throws If the player to attack doesn't exist in the game
       * @throws If the player to attack doesn't have any lives left
       * @throws If the player to attack is out of range
       */
      async attack(gameId: string, userId: string, toAttackUserId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: {
            id: true,
            lives: true,
            points: true,
          },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (player.lives < 1) {
          throw new PlayerIsNotAliveError();
        }

        if (player.points < 1) {
          throw new PlayerDoesNotHavePointsToAttackError();
        }

        const toAttackPlayer = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: toAttackUserId, gameId } },
          select: {
            id: true,
            lives: true,
            points: true,
          },
        });

        if (!toAttackPlayer) {
          throw new PlayerToAttackIsNotInGame();
        }

        if (toAttackPlayer.lives < 1) {
          throw new PlayerToAttackIsDeadError();
        }

        const playersInRange = await prisma.player.getPlayersInRange(
          gameId,
          userId
        );

        if (!playersInRange.some((player) => player.id === toAttackPlayer.id)) {
          throw new PlayerToAttackIsOutOfRangeError();
        }

        if (toAttackPlayer.lives === 1) {
          const halfPoints = Math.floor(toAttackPlayer.points / 2);
          await prisma.$transaction(async (transaction) => {
            await transaction.player.removeLife(gameId, toAttackUserId);
            await transaction.player.pointsSubtract(gameId, userId, 1);

            await transaction.log.create({
              data: {
                gameId,
                type: LogType.ATTACK,
                data: JSON.stringify({
                  player: userId,
                  toAttackPlayer: toAttackUserId,
                }),
              },
            });

            await transaction.log.create({
              data: {
                gameId,
                type: LogType.KILL,
                data: JSON.stringify({
                  player: userId,
                  killedPlayer: toAttackUserId,
                }),
              },
            });

            await transaction.player.pointsSubtract(
              gameId,
              toAttackUserId,
              halfPoints
            );
            await transaction.player.pointsAdd(gameId, userId, halfPoints);
            await transaction.player.update({
              where: { userId_gameId: { userId, gameId } },
              data: { kills: { increment: 1 } },
            });
          });
          return { killed: true, halfPoints, remainingLives: 0 };
        }

        await prisma.$transaction(async (transaction) => {
          await transaction.player.removeLife(gameId, toAttackUserId);
          await transaction.player.pointsSubtract(gameId, userId, 1);
          await transaction.log.create({
            data: {
              gameId,
              type: LogType.ATTACK,
              data: JSON.stringify({
                player: userId,
                toAttackPlayer: toAttackUserId,
              }),
            },
          });
        });
        return {
          killed: false,
          halfPoints: 0,
          remainingLives: toAttackPlayer.lives - 1,
        };
      },

      /**
       * Use this when you want to get the players in range of another player.
       * @param gameId The game to get the players in range in
       * @param userId The player to get the players in range of
       * @returns The players in range
       * @throws If the player doesn't exist in the game
       * @throws If the game doesn't exist
       */
      async getPlayersInRange(gameId: string, userId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: {
            id: true,
            coords: { select: { x: true, y: true } },
            range: true,
            game: {
              select: {
                players: {
                  select: {
                    id: true,
                    coords: { select: { x: true, y: true } },
                    lives: true,
                  },
                },
              },
            },
          },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        if (!player.game) {
          throw new GameNotFoundError();
        }

        return player.game.players
          .filter((p) => p.lives > 0)
          .filter(
            (p) =>
              Math.floor(
                Math.max(
                  Math.abs(player.coords.x - p.coords.x), // distance X
                  Math.abs(player.coords.y - p.coords.y) // distance Y
                )
              ) <= player.range
          );
      },
    },
    game: {
      async isFinished(gameId: string) {
        const game = await boringPrisma.game.findUnique({
          where: { id: gameId },
          select: {
            type: true,
            players: {
              select: {
                lives: true,
                team: true,
              },
            },
          },
        });

        if (!game) {
          throw new GameNotFoundError();
        }

        switch (game.type) {
          case GameType.TEAM:
            const teams = game.players.reduce(
              (acc, player) => {
                if (!acc[player.team!]) {
                  acc[player.team!] = [];
                }
                acc[player.team!].push(player);
                return acc;
              },
              {} as Record<Team, { lives: number }[]>
            );

            return (
              Object.values(teams).filter((team) =>
                team.some((player) => player.lives > 0)
              ).length <= 1
            );

          case GameType.FFA:
          case GameType.HIDDEN:
            return (
              game.players.filter((player) => player.lives > 0).length <= 1
            );

          default:
            return true;
        }
      },
      async isPlayerAlive(gameId: string, userId: string) {
        const player = await boringPrisma.player.findUnique({
          where: { userId_gameId: { userId: userId, gameId } },
          select: { lives: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        return player.lives > 0;
      },
      async getGameFromChannel(channelId: string, threadId: string) {
        const game = await prisma.game.findFirst({
          where: { channelId, threadId },
          select: defaultGameSelect,
        });

        if (!game) {
          throw new GameNotFoundError();
        }

        return game;
      },
      async createSetupGame(context: {
        guildId: string;
        channelId: string;
        threadId: string;
        createdById: string;
        type: GameType;
        pointInterval: number;
      }) {
        const game = await prisma.game.create({
          data: { ...context, status: GameStatus.SETUP, width: 0, height: 0 },
        });

        return game;
      },
      async finishSetupGame(gameId: string) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.SETUP) {
          throw new GameNotInSetupModeError();
        }

        const width = game.players.length * 5;
        const height = game.players.length * 3;

        const coords = generateCoordsWithFullListOfUsers(
          game.players.map((player) => player.userId),
          width,
          height
        );
        const playerColors = generateColorsForUsers(
          game.players.map((player) => player.userId)
        );

        await prisma.$transaction([
          ...game.players.map((player) => {
            const coordsForPlayer = coords.find(
              (coord) => coord.user === player.userId
            )!;
            return prisma.player.update({
              where: { id: player.id },
              data: {
                coords: {
                  update: {
                    x: coordsForPlayer.x,
                    y: coordsForPlayer.y,
                  },
                },
                color: playerColors.find(
                  (color) => color.user === player.userId
                )!.color,
              },
            });
          }),
          prisma.game.update({
            where: { id: gameId },
            data: {
              status: GameStatus.STARTING,
              width,
              height,
            },
          }),
          prisma.log.create({
            data: {
              gameId: gameId,
              type: LogType.INFO,
              data: JSON.stringify({
                message: 'Game has been finished setting up',
              }),
            },
          }),
        ]);

        return game;
      },
      async createGame(context: {
        guildId: string;
        channelId: string;
        threadId: string;
        createdById: string;
        type: GameType;
        players: {
          userId: string;
        }[];
        pointInterval: number;
      }) {
        const width = Math.min(context.players.length * 5, 20);
        const height = Math.min(context.players.length * 3, 20);
        const coords = generateCoordsWithFullListOfUsers(
          context.players.map(({ userId }) => userId),
          width,
          height
        );
        const playerColors = generateColorsForUsers(
          context.players.map(({ userId }) => userId)
        );

        const game = await prisma.game.create({
          data: {
            ...context,
            status: GameStatus.SETUP,
            width,
            height,
            players: {
              create: coords.map(({ x, y, user }) => ({
                userId: user,
                coords: { create: { x, y } },
                lives: 3,
                points: 1,
                range: 2,
                color: playerColors.find((color) => color.user === user)!.color,
              })),
            },
          },
        });

        return game;
      },
      async addPlayerToGame(gameId: string, userId: string) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.SETUP) {
          throw new GameNotInSetupModeError();
        }

        const player = game.players.find((player) => player.userId === userId);

        if (player) {
          throw new PlayerIsAlreadyInGameError();
        }

        await prisma.$transaction(async (transaction) => {
          const dbCoords = await transaction.coordinates.create({
            data: { x: -1, y: -1 },
          });

          await transaction.log.create({
            data: {
              gameId,
              type: LogType.INFO,
              data: JSON.stringify({
                message: 'Player has been added to the game',
                player: userId,
              }),
            },
          });

          await transaction.player.create({
            data: {
              userId,
              gameId,
              coordsId: dbCoords.id,
              lives: 3,
              points: 1,
              range: 2,
              color: 'UNSET',
            },
          });
        });
      },
      async removePlayerFromGame(gameId: string, userId: string) {
        const player = await prisma.player.findUnique({
          where: { userId_gameId: { userId, gameId } },
          select: { id: true },
        });

        if (!player) {
          throw new PlayerDoesNotExistInGameError();
        }

        await prisma.$transaction([
          prisma.player.delete({ where: { id: player.id } }),
          prisma.log.create({
            data: {
              gameId,
              type: LogType.INFO,
              data: JSON.stringify({
                message: 'Player has been removed from the game',
                player: userId,
              }),
            },
          }),
        ]);
        return player;
      },
      async startGame(gameId: string) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.STARTING) {
          throw new GameNotInStartingModeError();
        }

        return prisma.game.update({
          where: { id: gameId },
          data: { status: GameStatus.STARTED },
          select: defaultGameSelect,
        });
      },
      async endGame(gameId: string) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.STARTED) {
          throw new GameIsNotStartedError();
        }
        await prisma.game.update({
          where: { id: gameId },
          data: { status: GameStatus.ENDED },
        });

        return game;
      },
      async getPlayers(gameId: string) {
        const players = await prisma.player.findMany({
          where: { gameId },
          select: defaultPlayerSelect,
        });

        return players;
      },
      async getLogs(gameId: string) {
        const logs = await prisma.log.findMany({
          where: { gameId },
          select: {
            id: true,
            type: true,
            data: true,
            createdAt: true,
          },
        });

        return logs;
      },
      async getGame(gameId: string) {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          select: defaultGameSelect,
        });

        if (!game) {
          throw new GameNotFoundError();
        }

        return game;
      },
      async getGames(guildId: string) {
        return boringPrisma.game.findMany({
          where: { guildId },
          select: defaultGameSelect,
        });
      },
      async getAllGames(status?: GameStatus) {
        return boringPrisma.game.findMany({
          where: status ? { status } : {},
          select: defaultGameSelect,
        });
      },
      async setNextAPTime(gameId: string, nextActionpointTime: Date) {
        return prisma.game.update({
          where: { id: gameId },
          data: { nextPointAt: nextActionpointTime },
          select: defaultGameSelect,
        });
      },
      async giveAP(gameId: string) {
        const game = await prisma.game.getGame(gameId);
        if (game.status !== GameStatus.STARTED) {
          throw new GameIsNotStartedError();
        }

        const playersWithLife = game.players.filter(
          (player) => player.lives > 0
        );

        await prisma.$transaction(async (transaction) => {
          await Promise.all(
            playersWithLife.map((player) =>
              transaction.player.pointsAdd(gameId, player.userId, 1)
            )
          );

          await transaction.log.create({
            data: {
              gameId,
              type: LogType.INFO,
              data: JSON.stringify({
                message: 'All alive players have been given 1 AP',
                players: playersWithLife.map((player) => player.userId),
              }),
            },
          });
        });
      },
      async setPointInterval(gameId: string, pointInterval: number) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.SETUP) {
          throw new GameNotInSetupModeError();
        }

        return prisma.game.update({
          where: { id: gameId },
          data: { pointInterval },
          select: defaultGameSelect,
        });
      },
      async setGameType(gameId: string, type: GameType) {
        const game = await prisma.game.getGame(gameId);

        if (game.status !== GameStatus.SETUP) {
          throw new GameNotInSetupModeError();
        }

        return prisma.game.update({
          where: { id: gameId },
          data: { type },
          select: defaultGameSelect,
        });
      },
    },
  },
});

export const getGame = async (
  parentId: string,
  postId: string,
  interaction:
    | ChatInputCommandInteraction<'cached'>
    | ButtonInteraction<'cached'>,
  respond: RespondFunction,
  errorEphemeral = false
) => {
  try {
    const game = await prisma.game.getGameFromChannel(parentId, postId);
    return game;
  } catch (e) {
    if (e instanceof GameNotFoundError) {
      await respond(interaction, {
        content: 'This forum post does not have a game.',
        ephemeral: errorEphemeral,
      });
    } else {
      console.error(e);
      await respond(interaction, {
        content: 'An error occurred while getting the game.',
        ephemeral: errorEphemeral,
      });
    }
  }
  return null;
};

function generateColorsForUsers(users: string[]) {
  const colorsToUse = Object.keys(colors);
  const colorsForUsers: { color: string; user: string }[] = [];

  for (const user of users) {
    const color = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
    colorsToUse.splice(colorsToUse.indexOf(color), 1);
    colorsForUsers.push({ color, user });
  }

  return colorsForUsers;
}

function generateCoordsWithFullListOfUsers(
  users: string[],
  width: number,
  height: number
) {
  const coords: { x: number; y: number; user: string }[] = [];

  for (const user of users) {
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);

    while (coords.some((coord) => coord.x === x && coord.y === y)) {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    }

    coords.push({ x, y, user });
  }

  return coords;
}

const defaultGameSelect = {
  id: true,
  status: true,
  type: true,
  width: true,
  height: true,
  pointInterval: true,
  createdById: true,
  players: {
    select: {
      id: true,
      userId: true,
      coords: { select: { x: true, y: true } },
      lives: true,
      points: true,
      range: true,
      kills: true,
      team: true,
      color: true,
    },
  },
  channelId: true,
  guildId: true,
  threadId: true,
  nextPointAt: true,
} as const satisfies Prisma.GameSelect;

const defaultPlayerSelect = defaultGameSelect.players.select;

export type DefaultGameSelect = Prisma.GameGetPayload<{
  select: typeof defaultGameSelect;
}>;

export type DefaultPlayerSelect = Prisma.PlayerGetPayload<{
  select: typeof defaultPlayerSelect;
}>;
