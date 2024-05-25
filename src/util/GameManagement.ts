import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  time,
} from 'discord.js';
import { singleton } from 'tsyringe';
import { Direction, prisma } from './prisma';
import { GameStatus, GameType, LogType } from '@prisma/client';
import { gameImageGenerator } from './canvas';

export interface GameEvent {
  ATTACK: [game: Game, userId: string, targetId: string, kill: boolean];
  WALK: [game: Game, userId: string, steps: number, direction: Direction];
  POINT_GIVE: [game: Game, userId: string, targetId: string, points: number];
  RANGE_INCREASE: [game: Game, userId: string, range: number];
  END: [game: Game];
  AP: [game: Game];
}

type Game = {
  id: string;
  type: GameType;
  width: number;
  height: number;
  pointInterval: number;
  players: {
    userId: string;
    coords: { x: number; y: number };
    lives: number;
    range: number;
    color: string;
  }[];
  channelId: string;
  guildId: string;
  threadId: string;
  nextPointAt: Date | null;
};

@singleton()
export class GameManagement {
  timeouts = new Map<string, NodeJS.Timeout>();
  gameObserver = new Map<
    string,
    {
      update<K extends keyof GameEvent>(
        event: K,
        ...data: GameEvent[K]
      ): Awaitable<void>;
    }
  >();
  constructor(private readonly client: Client<true>) {}

  public async startGame(game: Game): Promise<void> {
    const forumPost = await this.getForumPost(
      game.id,
      game.guildId,
      game.channelId,
      game.threadId
    );

    if (!forumPost) {
      return;
    }

    await prisma.game.startGame(game.id);

    await this.apInterval(game.id);
  }

  public async loadGames() {
    const games = await prisma.game.getAllGames(GameStatus.STARTED);

    for (const game of games) {
      await this.setupGame(game);
    }
  }

  public subscribeToGame(
    gameId: string,
    observer: {
      update<K extends keyof GameEvent>(
        event: K,
        ...data: GameEvent[K]
      ): Awaitable<void>;
    }
  ) {
    this.gameObserver.set(gameId, observer);
  }

  public notifyGame<K extends keyof GameEvent>(
    gameId: string,
    event: K,
    ...data: GameEvent[K]
  ) {
    this.gameObserver.get(gameId)?.update(event, ...data);
  }

  public async getForumPost(
    gameId: string,
    guildId: string,
    channelId: string,
    postId: string
  ) {
    const guild = await this.client.guilds.resolve(guildId);
    if (!guild) {
      return this.forceEndGame(gameId);
    }

    const channel = await guild.channels.resolve(channelId);

    if (!channel || channel.type !== ChannelType.GuildForum) {
      return this.forceEndGame(gameId);
    }

    const forumPost = await channel.threads.fetch(postId);

    if (!forumPost || forumPost.parent?.type !== ChannelType.GuildForum) {
      return this.forceEndGame(gameId);
    }

    return forumPost;
  }

  public async setupGame(game: Game) {
    const forumPost = await this.getForumPost(
      game.id,
      game.guildId,
      game.channelId,
      game.threadId
    );

    if (!forumPost) {
      return;
    }

    const timeout = setTimeout(
      () => {
        this.apInterval(game.id);
      },
      Math.max(
        game.nextPointAt ? game.nextPointAt.getTime() - Date.now() : 1000,
        0
      )
    );

    this.timeouts.set(game.id, timeout);
  }

  public async apInterval(id: string) {
    const game = await prisma.game.getGame(id);

    if (!game || game.status !== GameStatus.STARTED) {
      return this.forceEndGame(id);
    }

    await prisma.game.giveAP(game.id);
    const nextInterval = new Date().getTime() + game.pointInterval;

    await prisma.game.setNextAPTime(game.id, new Date(nextInterval));

    const forumPost = await this.getForumPost(
      game.id,
      game.guildId,
      game.channelId,
      game.threadId
    );

    if (!forumPost) {
      return;
    }
    const buttons = [];

    if (game.type !== GameType.HIDDEN) {
      buttons.push(
        new ButtonBuilder()
          .setLabel('View AP')
          .setCustomId(`view_ap|${game.id}`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const discordMembers = await forumPost.guild.members.fetch({
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

    await forumPost.send({
      content: [
        '## Everyone that is currently alive received a free **action point**.',
        '',
        `### Next drop: ${time(new Date(nextInterval), 'R')}`,
      ].join('\n'),
      files: [
        new AttachmentBuilder(board, {
          name: `board-${game.id}.png`,
          description:
            'The board for the Tank Tactics game in this forum post.',
        }),
      ],
      ...(buttons.length > 0
        ? {
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons),
            ],
          }
        : {}),
    });

    const timeout = setTimeout(() => {
      this.apInterval(id);
    }, nextInterval - Date.now());

    this.timeouts.set(id, timeout);
  }

  async checkIfGameIsOver(id: string) {
    return prisma.game.isFinished(id);
  }

  async handleGameOver(id: string) {
    const game = await prisma.game.getGame(id);
    const forumPost = await this.getForumPost(
      game.id,
      game.guildId,
      game.channelId,
      game.threadId
    );

    if (!forumPost) {
      return;
    }

    if (!this.checkIfGameIsOver(game.id)) return;

    const discordMembers = await forumPost.guild.members.fetch({
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

    await forumPost.send({
      content: `### The game has ended!\n\n## Winners\n${game.players
        .filter((p) => p.lives > 0)
        .map((p) => `<@${p.userId}>`)
        .join(', ')}`,
      files: [
        {
          attachment: board,
          name: `final-board-${game.id}.png`,
        },
      ],
    });

    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: GameStatus.ENDED,
        logs: {
          create: {
            type: LogType.INFO,
            data: 'Game has ended.',
          },
        },
      },
    });

    const interval = this.timeouts.get(id);
    if (interval) {
      clearInterval(interval);
    }
  }

  public async forceEndGame(id: string, userId?: string) {
    await prisma.game.update({
      where: { id: id },
      data: {
        status: GameStatus.ENDED,
        logs: {
          create: {
            type: LogType.END,
            data: JSON.stringify({
              message: 'Game has been force ended.',
              userId: userId ?? 'SYSTEM',
            }),
          },
        },
      },
    });
    const interval = this.timeouts.get(id);
    if (interval) {
      clearInterval(interval);
    }
  }
}
