import {
  AdminCreateProductVariantInventoryKit,
  AdminCreateProductVariantPrice,
  AdminPrice,
  BaseFilterable,
  DeleteResponse,
  DeleteResponseWithParent,
  FindParams,
  OperatorMap,
  PaginatedResponse,
} from "@medusajs/framework/types";
import {
  AddonStatus,
  BaseAddon,
  BaseAddonListParams,
  BaseAddonVariant,
} from "./types";

/**
 * Addon
 */
export type AdminAddon = BaseAddon & {
  variants: AdminAddonVariant[] | null;
};
export interface AdminAddonResponse {
  addon: AdminAddon;
}
export interface AdminAddonDeleteResponse extends DeleteResponse<"addon"> {}
export type AdminAddonListResponse = PaginatedResponse<{
  addons: AdminAddon[];
}>;
export type AdminAddonListRequest = BaseAddonListParams;
export type AdminAddonListParams = BaseAddonListParams;
export type AdminAddonStatus = AddonStatus;
export interface AdminCreateAddon {
  title: string;
  handle?: string;
  metadata?: Record<string, any>;
  addon_group_id?: string;
  variants: AdminCreateAddonVariant[];
}
export interface AdminUpdateAddon {
  title?: string;
  handle?: string;
  thumbnail?: string;
  status?: AdminAddonStatus;
  metadata?: Record<string, any> | null;
  variants?: (AdminCreateAddonVariant | AdminUpdateAddonVariant)[];
}

/**
 * AddonVariant
 */
export type AdminAddonVariant = BaseAddonVariant & {
  prices: AdminPrice[] | null;
};
export interface AdminCreateAddonVariant {
  title: string;
  prices: AdminCreateProductVariantPrice[];
  inventory_items?: AdminCreateProductVariantInventoryKit[];
}
export interface AdminAddonVariantParams
  extends FindParams,
    BaseFilterable<AdminAddonVariantParams> {
  q?: string;
  id?: string | string[];
}
export type AdminAddonVariantListResponse = PaginatedResponse<{
  addon_variants: AdminAddonVariant[];
}>;
export interface AdminAddonVariantResponse {
  addon_variant: AdminAddonVariant;
}

export interface AdminUpdateAddonVariant
  extends Partial<AdminCreateAddonVariant> {}
export interface AdminAddonVariantDeleteResponse
  extends DeleteResponseWithParent<"addon_variant", AdminAddon> {}

/**
 * AddonGroup
 */
interface BaseAddonGroup {
  id: string;
  title: string;
  handle: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BaseAddonGroupListParams
  extends FindParams,
    BaseFilterable<BaseAddonGroupListParams> {
  q?: string;
  id?: string | string[];
  handle?: string | string[];
  title?: string | string[];
  created_at?: OperatorMap<string>;
  updated_at?: OperatorMap<string>;
}

export interface AdminAddonGroup extends BaseAddonGroup {}
export interface AdminAddonGroupsListParams extends BaseAddonGroupListParams {}
export interface AdminAddonGroupsListResponse
  extends PaginatedResponse<{
    addon_groups: BaseAddonGroup[];
  }> {}

export interface AdminAddonGroupResponse {
  addon_group: BaseAddonGroup;
}
export interface AdminAddonGroupDeleteResponse
  extends DeleteResponse<"addon_group"> {}

export interface AdminUpdateAddonGroup {
  title?: string;
  handle?: string;
}
export interface AdminCreateAddonGroup {
  title: string;
  handle?: string;
}