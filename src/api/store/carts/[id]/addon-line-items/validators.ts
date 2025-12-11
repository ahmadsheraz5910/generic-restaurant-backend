import { StoreAddCartLineItem } from "@medusajs/medusa/api/store/carts/validators";
import { z } from "zod";

export const StoreAddCartAddonLineItem = z.object({
  addon_variants: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().gt(0).optional(),
      metadata: z.record(z.unknown()).nullish(),
    })
  ),
  variant_id: z.string(),
  quantity: z.number().gt(0),
  metadata: z.record(z.unknown()).nullish(),
});

export const StoreUpdateCartAddonLineItem = z.object({
  quantity: z.number().gt(0).optional(),
  addon_variants: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().gt(0).optional(),
    })
  ).optional(),
});
export type StoreUpdateCartAddonLineItemType = z.infer<
  typeof StoreUpdateCartAddonLineItem
>;
export type StoreAddCartAddonLineItemType = z.infer<
  typeof StoreAddCartAddonLineItem
>;
