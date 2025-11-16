import {
  BaseFilterable,
  FindParams,
  OperatorMap,
  ProductStatus,
} from "@medusajs/framework/types";

export type AddonStatus = ProductStatus;
export interface BaseAddonListParams
  extends FindParams,
    BaseFilterable<BaseAddonListParams> {
  q?: string;
  status?: AddonStatus | AddonStatus[];
  title?: string | string[];
  handle?: string | string[];
  id?: string | string[];
  addon_group_id?: string | string[];
  created_at?: OperatorMap<string>;
  updated_at?: OperatorMap<string>;
  deleted_at?: OperatorMap<string>;
}

export interface BaseAddon {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: AddonStatus;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

export interface BaseAddonVariant {
  id: string;
  title: string;
  manage_inventory: boolean | null;
  variant_rank: number | null;
  addon_id: string;
  metadata: Record<string, unknown> | null;
  
}
