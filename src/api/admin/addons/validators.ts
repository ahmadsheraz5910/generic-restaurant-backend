import { ProductStatus } from "@medusajs/framework/utils";
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common";
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

/**
 * Addons variant
 */
export const AdminGetAddonVariantParams = createSelectParams();
export const AdminGetAddonVariantsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
});
export type AdminGetAddonVariantsParamsType = z.infer<
  typeof AdminGetAddonVariantsParams
>;
export const AdminGetAddonVariantsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetAddonVariantsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetAddonVariantsParamsFields));

export type AdminCreateVariantPriceType = z.infer<
  typeof AdminCreateVariantPrice
>;
export const AdminCreateVariantPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional(),
});

export const AdminUpdateVariantPrice = z.object({
  id: z.string().optional(),
  currency_code: z.string().optional(),
  amount: z.number().optional(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional(),
});
export type AdminUpdateVariantPriceType = z.infer<
  typeof AdminUpdateVariantPrice
>;

export const CreateAddonVariant = z
  .object({
    title: z.string(),
    manage_inventory: booleanString().optional().default(true),
    variant_rank: z.number().optional(),
    prices: z.array(AdminCreateVariantPrice),
    inventory_items: z
      .array(
        z.object({
          inventory_item_id: z.string(),
          required_quantity: z.number(),
        })
      )
      .optional(),
  })
  .strict();
export const AdminCreateAddonVariant = CreateAddonVariant;
export type AdminCreateAddonVariantType = z.infer<typeof CreateAddonVariant>;

export const UpdateAddonVariant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    prices: z
      .array(z.union([AdminUpdateVariantPrice, AdminCreateVariantPrice]))
      .optional(),
    manage_inventory: booleanString().optional(),
    variant_rank: z.number().optional(),
  })
  .strict();

export const AdminUpdateAddonVariant = UpdateAddonVariant;
export type AdminUpdateAddonVariantType = z.infer<typeof UpdateAddonVariant>;

export const AdminCreateVariantInventoryItem = z.object({
  required_quantity: z.number(),
  inventory_item_id: z.string(),
});
export type AdminCreateVariantInventoryItemType = z.infer<
  typeof AdminCreateVariantInventoryItem
>;
export const AdminUpdateVariantInventoryItem = z.object({
  required_quantity: z.number(),
});
export type AdminUpdateVariantInventoryItemType = z.infer<
  typeof AdminUpdateVariantInventoryItem
>;

/**
 * Addon
 */
const statusEnum = z.nativeEnum(ProductStatus);
export const AdminGetAddonParams = createSelectParams();
export type AdminGetAddonsParamsType = z.infer<typeof AdminGetAddonsParams>;
export const AdminGetAddonsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    addon_group_id: z.union([z.string(), z.array(z.string())]).optional()
  })
)

export type AdminCreateAddonType = z.infer<typeof CreateAddon>;
export const CreateAddon = z
  .object({
    title: z.string(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    status: statusEnum.optional().default(ProductStatus.DRAFT),
    variants: z.array(CreateAddonVariant).optional(),
    addon_group_id: z.string().nullish(),
  })
  .strict();
export const AdminCreateAddon = CreateAddon;

export type AdminUpdateAddonType = z.infer<typeof UpdateAddon>;
export const UpdateAddon = z
  .object({
    title: z.string().optional(),
    status: statusEnum.optional(),
    thumbnail: z.string().nullish(),
    handle: z.string().optional(),
    variants: z
      .array(z.union([UpdateAddonVariant, CreateAddonVariant]))
      .optional(),
    addon_group_id: z.string().nullish(),
  })
  .strict();
export const AdminUpdateAddon = UpdateAddon;
