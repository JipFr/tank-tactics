import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const AttackCommand = {
  name: 'attack',
  name_localizations: {
    nl: 'aanval',
  },
  description: 'Attack someone, taking 1 HP if they are in range, costs 1 AP',
  description_localizations: {
    nl: 'Val iemand aan en neem 1 HP als ze binnen bereik zijn, kost 1 AP',
  },
  options: {
    target: {
      type: ApplicationCommandOptionType.User,
      name: 'target',
      name_localizations: {
        nl: 'doelwit',
      },
      description: 'The person you want to attack',
      description_localizations: {
        nl: 'De persoon die je wilt aanvallen',
      },
      required: true,
    },
  },
} as const satisfies CommandPayload;
