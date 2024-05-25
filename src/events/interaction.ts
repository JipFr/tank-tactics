import {
  MessageFlags,
  InteractionReplyOptions,
  ApplicationCommandType,
  Message,
  CommandInteraction,
  ButtonInteraction,
  ChannelType,
  AttachmentBuilder,
  EmbedBuilder,
} from 'discord.js';
import { container } from 'tsyringe';
import type { BuildedCommand } from '../util/Command';
import { createEvent } from '../util/Event';
import { transformInteraction } from '../util/InteractionOptions';
import type { Logger } from '../util/Logger';
import { kCommands, kLogger } from '../util/tokens';
import { Util } from '../util/Util';
import { DefaultGameSelect, getGame } from '../util/prisma';
import { gameImageGenerator } from '../util/canvas';
import { splitArray } from '../util/splitArray';
const commands =
  container.resolve<Map<string, BuildedCommand<any, any>>>(kCommands);
const logger = container.resolve<Logger>(kLogger);

function respond(
  interaction: CommandInteraction | ButtonInteraction,
  data: InteractionReplyOptions
): Promise<Message<boolean>> {
  if (interaction.deferred) {
    return interaction.editReply(data);
  }
  return interaction.reply({ ...data, fetchReply: true });
}

async function handleViewAP(
  interaction: ButtonInteraction<'cached'>,
  game: DefaultGameSelect
) {
  const players = game.players.sort((a, b) => {
    if (a.points === b.points) return b.lives - a.lives;
    return b.points - a.points;
  });
  const splittedUsers = splitArray(players, 10);
  const embeds: EmbedBuilder[] = splittedUsers.map((users) => {
    return new EmbedBuilder().setDescription(
      users
        .map(
          (player) =>
            `<@${player.userId}> | **${player.points} AP** | ${player.lives} lives | ${player.range} range | (${player.coords.x}, ${player.coords.y}) | ${player.kills} kills`
        )
        .join('\n')
    );
  });
  return respond(interaction, {
    embeds,
    flags: MessageFlags.Ephemeral,
  });
}

async function handleViewBoard(
  interaction: ButtonInteraction<'cached'>,
  game: DefaultGameSelect
) {
  const discordMembers = await interaction.guild.members.fetch({
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

  return respond(interaction, {
    files: [
      new AttachmentBuilder(board, {
        name: `board-${game.id}.png`,
        description: 'The board for the Tank Tactics game in this forum post.',
      }),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

async function buttonInteractionHandler(
  interaction: ButtonInteraction<'cached'>
) {
  if (!interaction.customId.includes('|')) return;
  const [action, gameId] = interaction.customId.split('|') as [
    'view_board' | 'view_ap',
    string,
  ];

  if (
    !(
      interaction.channel?.isThread() &&
      interaction.channel.parent?.type === ChannelType.GuildForum
    )
  )
    return void respond(interaction, {
      content: 'This command can only be used in a forum post.',
      flags: MessageFlags.Ephemeral,
    });

  const game = await getGame(
    interaction.channel.parent.id,
    interaction.channelId,
    interaction,
    respond,
    true
  );

  if (!game) return;

  if (game.id !== gameId)
    return void respond(interaction, {
      content: 'This button is not for the game in this channel.',
      flags: MessageFlags.Ephemeral,
    });

  switch (action) {
    case 'view_board':
      return void handleViewBoard(interaction, game);

    case 'view_ap':
      return void handleViewAP(interaction, game);

    default:
      return void respond(interaction, {
        content: 'Unknown action.',
        flags: MessageFlags.Ephemeral,
      });
  }
}

export default createEvent('interactionCreate')
  .setOn(async (interaction) => {
    if (
      !interaction.isCommand() &&
      !interaction.isUserContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand() &&
      !interaction.isAutocomplete() &&
      !interaction.isMessageComponent() &&
      !interaction.isButton()
    )
      return;

    // We don't handle DM interactions.
    if (!interaction.inCachedGuild()) return;

    if (interaction.isButton()) return buttonInteractionHandler(interaction);

    if (interaction.isMessageComponent()) return;

    const timeStart = Date.now();
    let timeExecute = 0;

    const command = commands.get(interaction.commandName.toLowerCase());
    const fullCommand =
      interaction.isChatInputCommand() &&
      interaction.options.getSubcommand(false)
        ? `/${interaction.commandName} ${interaction.options.getSubcommand(
            true
          )}`
        : interaction.commandName;

    if (command && command.enabled) {
      try {
        if (
          command.guilds &&
          command.guilds.length > 0 &&
          interaction.guildId
        ) {
          if (!command.guilds.includes(interaction.guildId)) {
            if (!interaction.isAutocomplete())
              await respond(interaction, {
                content: 'This command is not available in this guild!',
                flags: MessageFlags.Ephemeral,
              });
            return;
          }
        }
        switch (interaction.commandType) {
          case ApplicationCommandType.ChatInput:
            const isAutocomplete = interaction.isAutocomplete();

            logger.info(
              `Executing ${
                isAutocomplete ? 'autocomplete' : 'chat input'
              } command ${fullCommand} by ${Util.getDiscordUserTag(
                interaction.user
              )} (${interaction.user.id}) in ${interaction.guild.name} (${
                interaction.guildId
              }), took ${Date.now() - timeStart}ms`
            );

            if (isAutocomplete) {
              if (command.functions.autocomplete) {
                timeExecute = Date.now();
                await command.functions.autocomplete({
                  interaction,
                  args: transformInteraction(interaction.options.data),
                  respond,
                });
              }
              break;
            }
            if (command.functions.chatInput) {
              timeExecute = Date.now();
              await command.functions.chatInput({
                interaction,
                args: transformInteraction(interaction.options.data),
                respond,
                subCommands: command.subCommands,
              });
            }
            break;

          case ApplicationCommandType.Message:
            logger.info(
              `Executing message context command ${
                interaction.commandName
              } by ${Util.getDiscordUserTag(interaction.user)} (${
                interaction.user.id
              }) in ${interaction.guild.name} (${interaction.guildId}), took ${
                Date.now() - timeStart
              }ms`
            );

            if (command.functions.messageContext) {
              timeExecute = Date.now();
              await command.functions.messageContext({
                interaction,
                args: transformInteraction(interaction.options.data),
                respond,
              });
            }
            break;

          case ApplicationCommandType.User:
            logger.info(
              `Executing user context command ${
                interaction.commandName
              } by ${Util.getDiscordUserTag(interaction.user)} (${
                interaction.user.id
              }) in ${interaction.guild.name} (${interaction.guildId}), took ${
                Date.now() - timeStart
              }ms`
            );

            if (command.functions.userContext) {
              timeExecute = Date.now();
              await command.functions.userContext({
                interaction,
                args: transformInteraction(interaction.options.data),
                respond,
              });
            }
            break;
        }

        const executedType = interaction.isAutocomplete()
          ? 'autocomplete'
          : interaction.commandType === ApplicationCommandType.Message
          ? 'message context'
          : interaction.commandType === ApplicationCommandType.User
          ? 'user context'
          : 'chat input';
        logger.info(
          `Executed ${executedType} command ${fullCommand} by ${Util.getDiscordUserTag(
            interaction.user
          )} (${interaction.user.id}) in ${interaction.guild.name} (${
            interaction.guildId
          }), took ${Date.now() - timeStart}ms (${
            Date.now() - timeExecute
          }ms to execute)`
        );
      } catch (e) {
        const executedType = interaction.isAutocomplete()
          ? 'autocomplete'
          : interaction.commandType === ApplicationCommandType.Message
          ? 'message context'
          : interaction.commandType === ApplicationCommandType.User
          ? 'user context'
          : 'chat input';
        logger.error(
          `Error while executing ${executedType} command ${fullCommand} by ${Util.getDiscordUserTag(
            interaction.user
          )} (${interaction.user.id}) in ${interaction.guild.name} (${
            interaction.guildId
          }), took ${Date.now() - timeStart}ms (${
            Date.now() - timeExecute
          }ms to execute)`
        );
        console.error(e);
      }
    } else {
      if (!interaction.isAutocomplete())
        await respond(interaction, {
          content: 'This command is not available!',
          flags: MessageFlags.Ephemeral,
        });
      else
        logger.warn(`Unknown autocomplete command ${interaction.commandName}`);
    }
  })
  .build();
