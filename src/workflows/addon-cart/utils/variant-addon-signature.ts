import {
  CartDTO,
  StoreCart,
  StoreCartLineItem,
} from "@medusajs/framework/types";

export const buildItemSignature = (item: {
  variant_id: string;
  addon_variants?:
    | Array<{
        id: string;
      }>
    | string[];
}) => {
  const addonVariants = item.addon_variants ?? [];

  return `${item.variant_id}-${addonVariants
    .map((av) => (typeof av === "string" ? av : av.id))
    .sort()
    .join(",")}`;
};

export const getLineItemAddons = (
  lineItem: StoreCartLineItem,
  cart: StoreCart
) => {
  const variantAddonSig = lineItem.metadata?.variant_addon_sig;
  if (!variantAddonSig) {
    return [];
  }
  return (
    cart.items?.filter(
      (item) =>
        typeof item.metadata?.addon_variant_id === "string" &&
        item.metadata?.variant_addon_sig === variantAddonSig
    ) ?? []
  );
};

export const findVariantItemWithSignature = (
  cart: StoreCart,
  signature: string
) => {
  return cart.items?.find(
    (item) =>
      item.variant_id &&
      typeof item.metadata?.variant_addon_sig === "string" &&
      item.metadata.variant_addon_sig === signature
  );
};

export const findAddonItemWithSignature = (
  cart: StoreCart,
  addon_variant_id: string,
  signature: string
) => {
  return cart.items?.find(
    (item) =>
      typeof item.metadata?.variant_addon_sig === "string" &&
      item.metadata.variant_addon_sig === signature &&
      typeof item.metadata?.addon_variant_id === "string" &&
      item.metadata.addon_variant_id === addon_variant_id
  );
};
