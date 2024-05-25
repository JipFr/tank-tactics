import { GameCommand } from '../../interactions/commands';
import { createCommand } from '../../util/Command';
import {
  gameAddPlayerSubCommand,
  gameFinishSetupSubCommand,
  gameLeaveSubCommand,
  gamePlayAgainSubCommand,
  gameRemovePlayerSubCommand,
  gameSetPointIntervalCommand,
  gameSetTypeCommand,
  gameSetupSubCommand,
  gameStartSubCommand,
} from './sub';
import { gameEndCommand } from './sub/end';

export default createCommand(GameCommand)
  .registerSubCommand('add-player', gameAddPlayerSubCommand)
  .registerSubCommand('remove-player', gameRemovePlayerSubCommand)
  .registerSubCommand('start', gameStartSubCommand)
  .registerSubCommand('finish-setup', gameFinishSetupSubCommand)
  .registerSubCommand('setup', gameSetupSubCommand)
  .registerSubCommand('play-again', gamePlayAgainSubCommand)
  .registerSubCommand('leave', gameLeaveSubCommand)
  .registerSubCommand('set-type', gameSetTypeCommand)
  .registerSubCommand('set-point-interval', gameSetPointIntervalCommand)
  .registerSubCommand('end', gameEndCommand)
  .registerChatInput(async ({ interaction, args, subCommands, respond }) => {
    await interaction.deferReply();
    switch (Object.keys(args)[0]) {
      case 'add-player':
        return subCommands['add-player']({
          interaction,
          args: args['add-player'],
          respond,
        });
      case 'remove-player':
        return subCommands['remove-player']({
          interaction,
          args: args['remove-player'],
          respond,
        });
      case 'start':
        return subCommands.start({ interaction, args: args.start, respond });
      case 'finish-setup':
        return subCommands['finish-setup']({
          interaction,
          args: args['finish-setup'],
          respond,
        });
      case 'setup':
        return subCommands.setup({ interaction, args: args.setup, respond });
      case 'play-again':
        return subCommands['play-again']({
          interaction,
          args: args['play-again'],
          respond,
        });
      case 'leave':
        return subCommands.leave({ interaction, args: args.leave, respond });
      case 'set-type':
        return subCommands['set-type']({
          interaction,
          args: args['set-type'],
          respond,
        });
      case 'set-point-interval':
        return subCommands['set-point-interval']({
          interaction,
          args: args['set-point-interval'],
          respond,
        });
      case 'end':
        return subCommands.end({ interaction, args: args.end, respond });
      default:
        return respond(interaction, { content: 'Invalid subcommand' });
    }
  })
  .build();
