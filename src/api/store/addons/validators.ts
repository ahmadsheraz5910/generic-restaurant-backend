import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import * as z from "zod";

export const StoreGetAddonsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    deleted_at: createOperatorMap().optional(),
    country_code: z.string().optional(),
    region_id: z.string().optional(),
    addon_group_id: z.union([z.string(), z.array(z.string())]).optional(),
  })
);

export type StoreGetAddonsParamsType = z.infer<typeof StoreGetAddonsParams>;
