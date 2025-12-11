import {
  CreateLineItemForCartDTO,
  StoreProductVariant,
} from "@medusajs/framework/types";

export const requiredFieldForAddonVariantLinkedEntityMap = [
  "id",
  "product",
  "product.title",
  "product.description",
  "product.handle",
  "product.addon_groups.id",
  "product.addon_groups.title",
  "product.addon_groups.handle",
  "product.addon_groups.addons.id",
  "product.addon_groups.addons.title",
  "product.addon_groups.addons.thumbnail",
  "product.addon_groups.addons.handle",
  "product.addon_groups.addons.variants.id",
  "product.addon_groups.addons.variants.quantity",
];
export const createAddonVariantLinkedEntityMap = (
  data: (StoreProductVariant & {
    product: {
      addon_groups: Array<{
        id: string;
        title: string;
        handle: string;
        addons: Array<{
          id: string;
          title: string;
          thumbnail: string;
          handle: string;
          variants: Array<{ id: string; quantity: number }>;
        }>;
      }>;
    };
  })[]
) => {
  const map = new Map(
    data.flatMap((pv) => {
      const product = pv.product;
      const addonGroups = product?.addon_groups ?? [];
      return addonGroups.flatMap((adg) => {
        const addons = adg?.addons ?? [];
        return addons.flatMap((ad) => {
          const addonVariants = ad?.variants ?? [];
          return addonVariants.map((av) => {
            return [
              av?.id as string,
              {
                variant: pv,
                addon: ad,
                addonGroup: adg,
                addonVariant: av,
              },
            ];
          });
        });
      });
    })
  );
  // Apparently passing a Map to step functions is not supported, so we need to convert it to an object
  return Object.fromEntries(map);
};

export const prepareAddonVariantItem = (data: {
  item: Omit<CreateLineItemForCartDTO, "title">;
  addonVariantData: ReturnType<
    typeof createAddonVariantLinkedEntityMap
  > extends Record<any, infer T>
    ? T
    : never;
  signature: string;
  addonQuantity?: number;
}) => {
  const { item, addonVariantData, signature, addonQuantity = 1 } = data;
  const variant = addonVariantData.variant;
  const addon = addonVariantData.addon;
  const addonVariant = addonVariantData.addonVariant;
  const addonGroup = addonVariantData.addonGroup;
  return {
    ...item,
    title: addon.title,
    thumbnail: addon.thumbnail,
    product_id: variant?.product?.id ?? item?.product_id,
    product_title: variant?.product?.title ?? item?.product_title,
    product_description:
      variant?.product?.description ?? item?.product_description,
    product_subtitle: variant?.product?.subtitle ?? item?.product_subtitle,
    product_type: variant?.product?.type?.value ?? item?.product_type ?? null,
    product_type_id:
      variant?.product?.type?.id ?? item?.product_type_id ?? null,
    product_collection:
      variant?.product?.collection?.title ?? item?.product_collection ?? null,
    product_handle: variant?.product?.handle ?? item?.product_handle,

    cart_id: item.cart_id,
    unit_price: item.unit_price ?? 0,
    quantity: item.quantity,

    metadata: {
      addon_variant_id: addonVariant.id,
      addon_variant_quantity: addonQuantity,
      variant_addon_sig: signature,
      addon_id: addon.id,
      addon_title: addon.title,
      addon_handle: addon.handle,
      addon_group_id: addonGroup.id,
      addon_group_title: addonGroup.title,
      addon_group_handle: addonGroup.handle,
    },
  } as CreateLineItemForCartDTO;
};
