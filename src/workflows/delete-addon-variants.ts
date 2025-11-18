import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteInventoryItemWorkflow,
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { ADDON_MODULE } from "../modules/addon";
import { deleteAddonVariantsStep } from "./steps/delete-addon-variants";

export type DeleteAddonVariantsWorkflowInput = {
  ids: string[];
};

export const deleteAddonVariantsWorkflowId = "delete-addon-variants";
export const deleteAddonVariantsWorkflow = createWorkflow(
  deleteAddonVariantsWorkflowId,
  (input: WorkflowData<DeleteAddonVariantsWorkflowInput>) => {
    const variantsWithInventoryStepResponse = useQueryGraphStep({
      entity: "variants",
      fields: [
        "id",
        "manage_inventory",
        "inventory.id",
        "inventory.variants.id",
      ],
      filters: {
        id: input.ids,
      },
    });

    removeRemoteLinkStep({
      [ADDON_MODULE]: { variant_id: input.ids },
    }).config({ name: "remove-variant-link-step" });

    const toDeleteInventoryItemIds = transform(
      { variants: variantsWithInventoryStepResponse.data },
      (data) => {
        const variants = data.variants || [];

        const variantsMap = new Map(variants.map((v) => [v.id, true]));
        const toDeleteIds: Set<string> = new Set();

        variants.forEach((variant) => {
          if (!variant.manage_inventory) {
            return;
          }

          for (const inventoryItem of variant.inventory || []) {
            if (
              inventoryItem?.variants?.every((v) => v && variantsMap.has(v.id))
            ) {
              toDeleteIds.add(inventoryItem.id);
            }
          }
        });

        return Array.from(toDeleteIds);
      }
    );

    deleteInventoryItemWorkflow.runAsStep({
      input: toDeleteInventoryItemIds,
    });

    const deletedProductVariants = deleteAddonVariantsStep(input.ids);

    return new WorkflowResponse(deletedProductVariants);
  }
);
