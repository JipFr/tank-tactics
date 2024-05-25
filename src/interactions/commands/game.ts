import { ApplicationCommandOptionType } from 'discord.js';
import {
  CommandPayload,
  IntegerOption,
  StringChoiceOption,
} from '../../util/SlashCommandUtils';

const GameTypeOption = {
  name: 'type',
  type: ApplicationCommandOptionType.String,
  name_localizations: {
    nl: 'type',
  },
  description: 'The type of game to create',
  description_localizations: {
    nl: 'Het type spel om te creëren',
  },
  required: true,
  choices: [
    {
      name: 'Free for All (Classic)',
      value: 'ffa',
      name_localizations: {
        nl: 'Ieder voor zich (Klassiek)',
      },
    },
    {
      name: 'Players AP Hidden',
      value: 'hidden',
      name_localizations: {
        nl: 'Spelers AP verborgen',
      },
    },
  ],
} as const satisfies StringChoiceOption;

const PointIntervalOption = {
  name: 'point-interval',
  type: ApplicationCommandOptionType.Integer,
  name_localizations: {
    nl: 'punt-interval',
  },
  description:
    'The amount of time between points being awarded to players who are still alive (in minutes)',
  description_localizations: {
    nl: 'De hoeveelheid tijd tussen het uitdelen van punten aan spelers die nog leven (in minuten)',
  },
  min_value: 1,
  max_value: 300,
  required: true,
} as const satisfies IntegerOption;

export const GameCommand = {
  name: 'game',
  name_localizations: {
    nl: 'spel',
  },
  description: 'Manage games with this command',
  description_localizations: {
    nl: 'Beheer spellen met dit commando',
  },
  options: {
    setup: {
      name: 'setup',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'opzetten',
      },
      description: 'Set up a game',
      options: {
        type: GameTypeOption,
        'point-interval': PointIntervalOption,
      },
    },
    'add-player': {
      name: 'add-player',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'speler-toevoegen',
      },
      description: 'Add a player to a game that is being set up',
      description_localizations: {
        nl: 'Voeg een speler toe aan een spel dat wordt opgezet',
      },
      options: {
        player: {
          name: 'player',
          type: ApplicationCommandOptionType.User,
          name_localizations: {
            nl: 'speler',
          },
          description: 'The player to add to the game',
          description_localizations: {
            nl: 'De speler om toe te voegen aan het spel',
          },
          required: true,
        },
      },
    },
    'remove-player': {
      name: 'remove-player',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'speler-verwijderen',
      },
      description: 'Remove a player from a game that is being set up',
      description_localizations: {
        nl: 'Verwijder een speler uit een spel dat wordt opgezet',
      },
      options: {
        player: {
          name: 'player',
          type: ApplicationCommandOptionType.User,
          name_localizations: {
            nl: 'speler',
          },
          description: 'The player to remove from the game',
          description_localizations: {
            nl: 'De speler om te verwijderen uit het spel',
          },
          required: true,
        },
      },
    },
    'finish-setup': {
      name: 'finish-setup',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'opzetten-voltooien',
      },
      description: 'Finish setting up a game',
      description_localizations: {
        nl: 'Het opzetten van een spel voltooien',
      },
    },
    leave: {
      name: 'leave',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'verlaten',
      },
      description: 'Leave the game in the channel you are in',
      description_localizations: {
        nl: 'Verlaat het spel in het kanaal waar je in zit',
      },
    },
    start: {
      name: 'start',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'starten',
      },
      description: 'Start the game in the channel you are in',
      description_localizations: {
        nl: 'Start het spel in het kanaal waar je in zit',
      },
    },
    'play-again': {
      name: 'play-again',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'opnieuw-spelen',
      },
      description:
        'Create a new game with the same players and settings as the previous game',
      description_localizations: {
        nl: 'Creëer een nieuw spel met dezelfde spelers en instellingen als het vorige spel',
      },
    },
    'set-point-interval': {
      name: 'set-point-interval',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'punt-interval-instellen',
      },
      description: 'Set the point interval for the game',
      description_localizations: {
        nl: 'Stel het puntinterval voor het spel in',
      },
      options: {
        'point-interval': PointIntervalOption,
      },
    },
    'set-type': {
      name: 'set-type',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'type-instellen',
      },
      description: 'Set the type of the game',
      description_localizations: {
        nl: 'Stel het type van het spel in',
      },
      options: {
        type: GameTypeOption,
      },
    },
    end: {
      name: 'end',
      type: ApplicationCommandOptionType.Subcommand,
      name_localizations: {
        nl: 'eindigen',
      },
      description: 'End the game in the channel you are in',
      description_localizations: {
        nl: 'Beëindig het spel in het kanaal waar je in zit.',
      },
    },
  },
} as const satisfies CommandPayload;
