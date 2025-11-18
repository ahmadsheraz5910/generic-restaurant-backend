import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { getAddonsStep } from "./steps/get-addons";
import {
  deleteInventoryItemWorkflow,
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { deleteAddonsStep } from "./steps/delete-addons";
import { ADDON_MODULE } from "../modules/addon";

export type DeleteAddonsWorkflowInput = {
  ids: string[];
};

export const deleteAddonsWorkflowId = "delete-addons";
export const deleteAddonsWorkflow = createWorkflow(
  deleteAddonsWorkflowId,
  (input: WorkflowData<DeleteAddonsWorkflowInput>) => {
    const addonsToDelete = getAddonsStep({ ids: input.ids });
    const variantsToBeDeleted = transform({ addonsToDelete }, (data) => {
      return data.addonsToDelete
        .flatMap((product) => product.variants)
        .map((variant) => variant.id);
    });
    const variantsWithInventoryStepResponse = useQueryGraphStep({
      entity: "variants",
      fields: [
        "id",
        "manage_inventory",
        "inventory.id",
        "inventory.variants.id",
      ],
      filters: {
        id: variantsToBeDeleted,
      },
    });

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

    const [, deletedProduct] = parallelize(
      removeRemoteLinkStep({
        [ADDON_MODULE]: {
          variant_id: variantsToBeDeleted,
          addon_id: input.ids,
        },
      }).config({ name: "remove-addon-variant-link-step" }),
      deleteAddonsStep(input.ids)
    );

    return new WorkflowResponse(deletedProduct);
  }
);
