import type { LinkWorkflowInput } from "@medusajs/framework/types";
import {
  WorkflowData,
  WorkflowResponse,
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

export const batchLinkAddonGroupsToProductGroupWorkflowId =
  "batch-link-addon-groups-to-product";

/**
 * This workflow manages the links between a addonGroup and products. It's used by the
 *
 * @example
 * const { result } = await batchLinkAddonGroupsToProductWorkflow(container)
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
export const batchLinkAddonGroupsToProductWorkflow = createWorkflow(
  batchLinkAddonGroupsToProductGroupWorkflowId,
  (input: WorkflowData<LinkWorkflowInput>): WorkflowData<void> => {
    const productId = input.id;
    const { data: productRecord } = useQueryGraphStep({
      entity: "product",
      fields: ["id", 'addon_groups.id'],
      filters: {
        id: productId,
      },
    });
    const { addonGroupIdsToLink, addonGroupIdsToUnlink } = transform(
      {productRecord, input},
      (t_input) => {
        const {productRecord, input} = t_input as any;
        
        const existingAddonGroupIds =
          productRecord.addon_groups?.map((p) => p?.id) ?? [];
        const toRemoveMap = new Map(
          input.remove?.map((id) => [id, true]) ?? []
        );
        const addonGroupIdsToUnlink = input.remove ?? [];
        const addonGroupIdsToLink = [
          ...existingAddonGroupIds.filter((id: any) => !toRemoveMap.has(id)),
          ...(input.add ?? []),
        ];
        return {
          addonGroupIdsToLink: addonGroupIdsToLink.map((id) => ({
            [ADDON_MODULE]: {
              addon_group_id: id,
            },
            [Modules.PRODUCT]: {
              product_id: input.id,
            },
          })),
          addonGroupIdsToUnlink: addonGroupIdsToUnlink.map((id) => ({
            [ADDON_MODULE]: {
              addon_group_id: id,
            },
            [Modules.PRODUCT]: {
              product_id: input.id,
            },
          })),
        };
      }
    );
    createRemoteLinkStep(addonGroupIdsToLink);
    dismissRemoteLinkStep(addonGroupIdsToUnlink);
  }
);
