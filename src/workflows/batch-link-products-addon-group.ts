import type { LinkWorkflowInput } from "@medusajs/framework/types";
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { ADDON_MODULE } from "../modules/addon";
import { Modules } from "@medusajs/framework/utils";

export const batchLinkProductsToAddonGroupWorkflowId =
  "batch-link-products-to-addon-group";

/**
 * This workflow manages the links between a addonGroup and products. It's used by the
 *
 * @example
 * const { result } = await batchLinkProductsToAddonGroupWorkflow(container)
 * .run({
 *   input: {
 *     id: "aGroupId_123",
 *     add: ["addon_123"],
 *     remove: ["addon_456"],
 *   }
 * })
 *
 * @summary
 *
 * Manage the links between a addonGroup and products.
 */
export const batchLinkProductsToAddonGroupWorkflow = createWorkflow(
  batchLinkProductsToAddonGroupWorkflowId,
  (input: WorkflowData<LinkWorkflowInput>): WorkflowData<void> => {
    const addonGroupId = input.id;
    const { data: addonGroup } = useQueryGraphStep({
      entity: "addon_group",
      fields: ["id", "products.id"],
      filters: {
        id: addonGroupId,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });
    const { productIdsToLink, productIdsToUnlink } = transform(
      { addonGroup, input },
      ({ addonGroup: [data], input }) => {
        const existingProductIds = data.products?.map((p) => p?.id) ?? [];
        const toRemoveMap = new Map(
          input.remove?.map((id) => [id, true]) ?? []
        );
        const productIdsToUnlink = input.remove ?? [];
        const productIdsToLink = [
          ...existingProductIds.filter((id: any) => !toRemoveMap.has(id)),
          ...(input.add ?? []),
        ];
        return {
          productIdsToLink: productIdsToLink.map((productId) => ({
            [ADDON_MODULE]: {
              addon_group_id: addonGroupId,
            },
            [Modules.PRODUCT]: {
              product_id: productId,
            },
          })),
          productIdsToUnlink: productIdsToUnlink.map((productId) => ({
            [ADDON_MODULE]: {
              addon_group_id: addonGroupId,
            },
            [Modules.PRODUCT]: {
              product_id: productId,
            },
          })),
        };
      }
    );
    createRemoteLinkStep(productIdsToLink);
    dismissRemoteLinkStep(productIdsToUnlink);
  }
);
