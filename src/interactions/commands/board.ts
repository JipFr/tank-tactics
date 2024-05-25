import { CommandPayload } from '../../util/SlashCommandUtils';

export const BoardCommand = {
  name: 'board',
  description: 'Get an up-to-date view of the board',
  name_localizations: {
    nl: 'bord',
  },
  description_localizations: {
    nl: 'Vraag een actueel overzicht van het bord op',
  },
} as const satisfies CommandPayload;
