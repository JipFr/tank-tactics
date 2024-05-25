import { CommandPayload } from '../../util/SlashCommandUtils';

export const RangeCommand = {
  name: 'range',
  name_localizations: {
    nl: 'bereik',
  },
  description: 'Trade 2 AP for a range increase',
  description_localizations: {
    nl: 'Ruil 2 AP voor een bereikvergroting',
  },
} as const satisfies CommandPayload;
