import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const WalkCommand = {
  name: 'walk',
  name_localizations: {
    nl: 'loop',
  },
  description: 'Use 1 AP (for each step) to walk to one of the 8 directions',
  description_localizations: {
    nl: 'Gebruik 1 AP (per stap) om naar een van de 8 richtingen te lopen',
  },
  options: {
    direction: {
      type: ApplicationCommandOptionType.String,
      name: 'direction',
      name_localizations: {
        nl: 'richting',
      },
      description: 'The direction you want to walk to',
      description_localizations: {
        nl: 'De richting waar je naartoe wilt lopen',
      },
      required: true,
      choices: [
        {
          name: 'Up',
          name_localizations: {
            nl: 'Omhoog',
          },
          value: 'up',
        },
        {
          name: 'Up-Right',
          name_localizations: {
            nl: 'Rechtsboven',
          },
          value: 'up-right',
        },
        {
          name: 'Right',
          name_localizations: {
            nl: 'Rechts',
          },
          value: 'right',
        },
        {
          name: 'Down-Right',
          name_localizations: {
            nl: 'Rechtsonder',
          },
          value: 'down-right',
        },
        {
          name: 'Down',
          name_localizations: {
            nl: 'Omlaag',
          },
          value: 'down',
        },
        {
          name: 'Down-Left',
          name_localizations: {
            nl: 'Linksonder',
          },
          value: 'down-left',
        },
        {
          name: 'Left',
          name_localizations: {
            nl: 'Links',
          },
          value: 'left',
        },
        {
          name: 'Up-Left',
          name_localizations: {
            nl: 'Linksboven',
          },
          value: 'up-left',
        },
      ],
    },
    amount: {
      type: ApplicationCommandOptionType.Integer,
      name: 'amount',
      name_localizations: {
        nl: 'hoeveelheid',
      },
      description: 'The amount of steps you want to walk',
      description_localizations: {
        nl: 'Het aantal stappen dat je wilt lopen',
      },
      required: true,
      min_value: 1,
    },
  },
} as const satisfies CommandPayload;
