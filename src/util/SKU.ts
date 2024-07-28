import {
  APIActionRowComponent,
  APIButtonComponent,
  ComponentType,
  JSONEncodable,
} from 'discord.js';

const premuimGuildSku = process.env.SKU_PREMIUM_GUILD;

export const isPremiumGuildCheck = (skuId: string) => {
  if (!premuimGuildSku) return true;
  return premuimGuildSku === skuId;
};

export const premiumGuildRow = {
  toJSON(): APIActionRowComponent<APIButtonComponent> {
    return {
      type: ComponentType.ActionRow,
      components: [
        // @ts-expect-error - This is a valid button, just not in the typings yet
        {
          type: ComponentType.Button,
          style: 6,
          sku_id: premuimGuildSku,
        } as APIButtonComponent,
      ],
    };
  },
} satisfies JSONEncodable<APIActionRowComponent<APIButtonComponent>>;

// export const premiumGuildRow = new ActionRowBuilder<ButtonBuilder>({
//   components: [
//     new ButtonBuilder({
//       style: ButtonStyle.Premium,
//       sku_id: premuimGuildSku,
//     }),
//   ],
// });
