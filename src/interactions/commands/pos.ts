import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const PosCommand = {
  name: 'pos',
  name_localizations: {
    nl: 'positie',
  },
  description: 'Get your current position, or the position of another user',
  description_localizations: {
    nl: 'Vraag je huidige positie op, of die van een andere gebruiker',
  },
  options: {
    user: {
      name: 'user',
      name_localizations: {
        nl: 'gebruiker',
      },
      type: ApplicationCommandOptionType.User,
      description: 'The user to get the position of',
      description_localizations: {
        nl: 'De gebruiker waarvan je de positie wilt opvragen',
      },
      required: false,
    },
  },
} as const satisfies CommandPayload;
