import {
  BaseFilterable,
  OperatorMap,
  ProductStatus,
} from "@medusajs/framework/types";
import { ProductUtils } from "@medusajs/framework/utils";

/**
 * Addon Groups
 */
export type AddonGroupDTO = {
  id: string | null;
  title: string;
  handle: string | null;
  metadata: Record<string, unknown> | null;
};

export type CreateAddonGroupDTO = {
  title: string;
  handle?: string;
  //In one-to-many relationship, we can only associate/dissociate from the entity that has belongs-to clause
  addon_ids?: string[];
};

export type UpdateAddonGroupDTO = {
  id?: string;
  title?: string;
  handle?: string;
  //In one-to-many relationship, we can only associate/dissociate from the entity that has belongs-to clause
  // Since I have implemented updateAddonGroupsDeep, this can be added as an optional field
  addon_ids?: string[];
};

export type UpsertAddonGroupDTO = CreateAddonGroupDTO | UpdateAddonGroupDTO;

export type FilterableAddonGroupProps = {
  q?: string;
  id?: string | string[];
  handle?: string | string[];
  title?: string | string[];
};

/**
 * Addon
 */
export type AddonStatusEnum = ProductStatus;
export type AddonDTO = {
  id: string | null;
  title: string;
  thumbnail: string | null;
  handle: string | null;
  status: AddonStatusEnum | null;
  addonGroup: AddonGroupDTO | null;
  variants?: AddonVariantDTO[];
};

export interface FilterableAddonProps
  extends BaseFilterable<FilterableAddonProps> {
  q?: string;
  status?:
    | ProductStatus
    | ProductStatus[]
    | OperatorMap<ProductStatus | ProductStatus[]>;
  title?: string | string[] | OperatorMap<string | string[]>;
  handle?: string | string[] | OperatorMap<string | string[]>;
  addon_group_id?: string | string[] | OperatorMap<string | string[]>;
  id?: string | string[] | OperatorMap<string | string[]>;
  created_at?: string | OperatorMap<string>;
  updated_at?: string | OperatorMap<string>;
  deleted_at?: string | OperatorMap<string>;
}

export interface CreateAddonDTO {
  id?: string;
  title: string;
  thumbnail?: string | null;
  handle?: string;
  status?: ProductUtils.ProductStatus;
  addon_group_id?: string | null;
}
export interface UpdateAddonDTO {
  title?: string;
  thumbnail?: string | null;
  handle?: string;
  status?: ProductUtils.ProductStatus;
  addon_group_id?: string | null;
}
export interface UpsertAddonDTO extends UpdateAddonDTO {
  id: string;
}

/**
 * Addon Variant
 */
export interface FilterableAddonVariantProps
  extends BaseFilterable<FilterableAddonVariantProps> {
  q?: string;
  id?: string | string[] | OperatorMap<string | string[]>;
  title?: string | string[] | OperatorMap<string | string[]>;
  manage_inventory?: boolean | boolean[] | OperatorMap<boolean | boolean[]>;
  variant_rank?: number | number[] | OperatorMap<number | number[]>;
  addon_id?: string | string[] | OperatorMap<string | string[]>;
  metadata?:
    | Record<string, string>
    | Record<string, string[]>
    | OperatorMap<Record<string, string> | Record<string, string[]>>;
}
export interface AddonVariantDTO {
  id: string;
  title: string;
  manage_inventory: boolean | null;
  variant_rank: number | null;
  metadata: Record<string, unknown> | null;
  addon?: AddonDTO | null;
  addon_id?: string | null;
}
export interface CreateAddonVariantDTO {
  addon_id?: string;
  title: string;
  manage_inventory?: boolean;
  variant_rank?: number;
  metadata?: Record<string, string>;
}

export interface UpdateAddonVariantDTO {
  title?: string;
  manage_inventory?: boolean;
  variant_rank?: number;
  metadata?: Record<string, string>;
  addon_id?: string;
}
export interface UpsertAddonVariantDTO extends UpdateAddonVariantDTO {
  id?: string;
}
