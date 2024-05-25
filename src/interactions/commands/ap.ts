import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const APCommand = {
  name: 'ap',
  description: 'Get your game stats or the stats of another user',
  description_localizations: {
    nl: 'Vraag je spelstatistieken op, of die van een andere gebruiker',
  },
  options: {
    user: {
      name: 'user',
      name_localizations: {
        nl: 'gebruiker',
      },
      type: ApplicationCommandOptionType.User,
      description: 'The user to get the stats of',
      description_localizations: {
        nl: 'De gebruiker waarvan je de statistieken wilt opvragen',
      },
      required: false,
    },
  },
} as const satisfies CommandPayload;
