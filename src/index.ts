import 'reflect-metadata';
import 'dotenv/config';

declare global {
  type Awaitable<T> = T | PromiseLike<T>;
}

import { container } from 'tsyringe';
import { BuildedCommand, commandInfo } from './util/Command';
import { kCommands, kLogger } from './util/tokens';
import readdirp from 'readdirp';
import path from 'node:path';
import { Logger } from './util/Logger';
import { Client, GatewayIntentBits, Options } from 'discord.js';
import type { BuildedEvent } from './util/Event';

const logger = new Logger('');
container.register(kLogger, { useValue: logger });

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    GuildBanManager: 0,
    GuildEmojiManager: 0,
    PresenceManager: 0,
    VoiceStateManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    StageInstanceManager: 0,
    BaseGuildEmojiManager: 0,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
    MessageManager: 0,
    GuildForumThreadManager: 100,
    AutoModerationRuleManager: 0,
    ApplicationCommandManager: 0,
    GuildTextThreadManager: 0,
  }),
});

const commands = new Map<string, BuildedCommand>();

container.register(Client, { useValue: client });

container.register(kCommands, { useValue: commands });

const commandFiles = readdirp(path.join(__dirname, './commands'), {
  fileFilter: '*.js',
  directoryFilter: '!sub',
});

const eventFiles = readdirp(path.join(__dirname, './events'), {
  fileFilter: '*.js',
});

async function bootstrap() {
  for await (const dir of commandFiles) {
    const cmdInfo = commandInfo(dir.path);
    if (!cmdInfo) continue;

    const command = (await import(dir.fullPath)).default as BuildedCommand;
    // if command is class ignore it
    if (typeof command !== 'object') continue;
    logger.info(`Registering command: ${command.name}`);

    commands.set(command.name.toLowerCase(), command);
  }

  for await (const dir of eventFiles) {
    const event = (await import(dir.fullPath)).default as BuildedEvent<any>;
    // split eventname by uppercase letter and only set the first letter of the first word to uppercase
    const eventName = (event.name as string)
      .split(/(?=[A-Z])/)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
    logger.info(`Registering event: ${eventName}`);

    if (event.enabled) {
      client.on(event.name, event.execute);
    }
  }

  await client.login(process.env.DISCORD_BOT_TOKEN);
}

bootstrap().catch(console.error);
