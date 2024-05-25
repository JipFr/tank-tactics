import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const GiftCommand = {
  name: 'gift',
  name_localizations: {
    nl: 'schenk',
  },
  description: 'Gift someone in your range a set amount of AP',
  description_localizations: {
    nl: 'Geef iemand in je bereik een bepaalde hoeveelheid AP',
  },
  options: {
    receiver: {
      type: ApplicationCommandOptionType.User,
      name: 'receiver',
      name_localizations: {
        'en-US': 'receiver',
        'en-GB': 'receiver',
        nl: 'ontvanger',
      },
      description: 'The person you want to gift AP',
      description_localizations: {
        nl: 'De persoon die je AP wilt schenken',
      },
      required: true,
    },
    amount: {
      type: ApplicationCommandOptionType.Integer,
      name: 'amount',
      name_localizations: {
        nl: 'hoeveelheid',
      },
      description: 'The amount of AP you want to gift',
      description_localizations: {
        nl: 'De hoeveelheid AP die je wilt schenken',
      },
      required: true,
      min_value: 1,
    },
  },
} as const satisfies CommandPayload;
