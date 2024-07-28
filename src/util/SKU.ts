const premiumSkus = process.env.SKU_IDS_PREMIUM?.split(',');

export const isPremiumCheck = (skuId: string) => {
  if (!premiumSkus) return true;
  return premiumSkus.includes(skuId);
};
