import type {
  Snowflake,
  Interaction,
  InteractionReplyOptions,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  Message,
  CommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { basename, extname } from 'node:path';
import type {
  ArgumentsOf,
  CommandPayload,
  SubCommandGroupOption,
  SubCommandNamesOf,
  SubCommandOption,
} from './SlashCommandUtils';

type RegisteredSubCommands = {
  [key: string]: SubCommandOption;
};

export const createCommand = <T extends CommandPayload>(payload: T) =>
  new Command<T>(payload);

export class Command<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands = {},
  AvailableSubCommands extends SubCommandNamesOf<T> = SubCommandNamesOf<T>,
> {
  private subCommands: SubCommands = {} as SubCommands;
  private guilds: Snowflake[] = [];
  private functions: CommandFunctions<T, SubCommands> = {};
  private enabled = true;

  constructor(private commandPayload: T) {}

  public registerSubCommand<N extends AvailableSubCommands>(
    name: N,
    // @ts-ignore
    subcommand: SubcommandFunction<T['options'][N]>
  ): Command<
    T,
    SubCommands & Record<N, T['options'][N]>,
    Exclude<AvailableSubCommands, N>
  > {
    this.subCommands = { ...this.subCommands, [name]: subcommand };
    return this;
  }

  public disable() {
    this.enabled = false;
    return this;
  }

  public enable() {
    this.enabled = true;
    return this;
  }

  public addGuild(guildId: Snowflake) {
    if (!this.guilds.includes(guildId)) {
      this.guilds.push(guildId);
    }
    return this;
  }

  public registerChatInput(chatInput: ChatInputFunction<T, SubCommands>) {
    this.functions.chatInput = chatInput;
    return this;
  }

  public registerAutocomplete(autocomplete: AutocompleteFunction<T>) {
    this.functions.autocomplete = autocomplete;
    return this;
  }

  public registerUserContext(userContext: UserContextFunction<T>) {
    this.functions.userContext = userContext;
    return this;
  }

  public registerMessageContext(messageContext: MessageContextFunction<T>) {
    this.functions.messageContext = messageContext;
    return this;
  }

  public build(): BuildedCommand<T, SubCommands> {
    return {
      name: this.commandPayload.name,
      commandPayload: this.commandPayload,
      subCommands: this.subCommands,
      guilds: this.guilds,
      functions: this.functions,
      enabled: this.enabled,
    };
  }
}

export interface BuildedCommand<
  C extends CommandPayload = CommandPayload,
  SubCommands extends RegisteredSubCommands = {},
> {
  name: string;
  commandPayload: C;
  subCommands: SubCommands;
  guilds: Snowflake[];
  functions: CommandFunctions<C, SubCommands>;
  enabled: boolean;
}

export interface CommandFunctions<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands,
> {
  chatInput?: ChatInputFunction<T, SubCommands>;
  autocomplete?: AutocompleteFunction<T>;
  userContext?: UserContextFunction<T>;
  messageContext?: MessageContextFunction<T>;
}

export type StandardInteractionFunction<
  InteractionType extends Interaction,
  CommandOrSubCommand extends
    | CommandPayload
    | SubCommandOption
    | SubCommandGroupOption,
> = (context: {
  interaction: InteractionType;
  args: ArgumentsOf<CommandOrSubCommand>;
  respond: RespondFunction;
}) => Awaitable<Message<boolean> | void>;

export type ChatInputFunction<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands,
> = (context: {
  interaction: ChatInputCommandInteraction<'cached'>;
  args: ArgumentsOf<T>;
  respond: RespondFunction;
  subCommands: {
    [K in keyof SubCommands]: SubcommandFunction<SubCommands[K]>;
  };
}) => Awaitable<Message<boolean> | void>;

export type AutocompleteFunction<T extends CommandPayload> =
  StandardInteractionFunction<AutocompleteInteraction<'cached'>, T>;

export type UserContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<UserContextMenuCommandInteraction<'cached'>, T>;

export type MessageContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<
    MessageContextMenuCommandInteraction<'cached'>,
    T
  >;

export type SubcommandFunction<T extends SubCommandOption> =
  StandardInteractionFunction<ChatInputCommandInteraction<'cached'>, T>;

export type RespondFunction = (
  interaction: CommandInteraction | ButtonInteraction,
  data: InteractionReplyOptions
) => Promise<Message<boolean>>;

export interface ICommandInfo {
  name: string;
}

export function commandInfo(path: string): ICommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
