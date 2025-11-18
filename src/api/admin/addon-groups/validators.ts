import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common";
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

export const AdminGetAddonGroupParams = createSelectParams();
export const AdminGetAddonGroupsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
});

export const AdminGetAddonGroupsParams = createFindParams({
  offset: 0,
  limit: 10,
})
  .merge(AdminGetAddonGroupsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetAddonGroupsParamsFields));
export type AdminGetAddonGroupsParamsType = z.infer<
  typeof AdminGetAddonGroupsParams
>;

export type AdminCreateAddonGroupType = z.infer<typeof AdminCreateAddonGroup>;
export const AdminCreateAddonGroup = z.object({
  title: z.string(),
  handle: z.string().optional(),
});

export const AdminUpdateAddonGroup = z.object({
  title: z.string().optional(),
  handle: z.string().optional()
});
export type AdminUpdateAddonGroupType = z.infer<typeof AdminUpdateAddonGroup>;

