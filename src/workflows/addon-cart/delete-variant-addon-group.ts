import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  deleteLineItemsStep,
  refreshCartItemsWorkflow,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { isDefined, MedusaError } from "@medusajs/framework/utils";
import { StoreCart } from "@medusajs/framework/types";

interface DeleteVariantAddonGroupInCartWorkflowInputDTO {
  cart_id: string;
  ids: string[];
}
export const deleteVariantAddonGroupInCartWorkflowId =
  "delete-variant-addon-group-to-cart";
export const deleteVariantAddonGroupInCartWorkflow = createWorkflow(
  {
    name: deleteVariantAddonGroupInCartWorkflowId,
    idempotent: false,
  },
  (input: DeleteVariantAddonGroupInCartWorkflowInputDTO) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    });

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: {
        id: input.cart_id,
      },
      fields: ["items.id", "items.variant_id", "items.metadata"],
      options:{
        throwIfKeyNotFound: true,
        isList: false,
      }
    });
    const itemIdsToDelete = transform(
      { inputItemIds: input.ids, cart: cart as unknown as StoreCart },
      (data) => {
        const notFoundItems = [] as string[];
        const itemIdsToDelete = [] as string[];
        for (const itemId of data.inputItemIds) {
          const cartVariantItem = data.cart?.items?.find(
            (item) => item.id === itemId && isDefined(item.variant_id)
          );
          if (!cartVariantItem) {
            notFoundItems.push(itemId);
          }
          const associatedAddonItems =
            data.cart?.items?.filter(
              (item) =>
                typeof item.metadata?.variant_addon_sig === "string" &&
                !item.metadata?.variant_addon_sig.includes(
                  item?.variant_id as string
                )
            ) ?? [];
          itemIdsToDelete.push(...associatedAddonItems.map((eai) => eai.id));
          itemIdsToDelete.push(itemId);
        }

        if (notFoundItems.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Items with id not found in cart: ${notFoundItems.join(", ")}`
          );
        }

        return itemIdsToDelete;
      }
    );

    deleteLineItemsStep(itemIdsToDelete);

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    });

    releaseLockStep({
      key: input.cart_id,
    });

    return new WorkflowResponse(void 0);
  }
);
