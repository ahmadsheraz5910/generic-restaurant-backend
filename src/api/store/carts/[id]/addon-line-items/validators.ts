import { StoreAddCartLineItem } from "@medusajs/medusa/api/store/carts/validators";
import { z } from "zod";

export const StoreAddCartAddonLineItem = z.object({
  addon_variant_ids: z.array(z.string()),
  variant_id: z.string(),
  quantity: z.number().gt(0),
});
export type StoreAddCartAddonLineItemType = z.infer<
  typeof StoreAddCartAddonLineItem
>;
