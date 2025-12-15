import {
  CreateCartCreateLineItemDTO,
  CreateLineItemForCartDTO,
  ICartModuleService,
  UpdateLineItemDTO,
  UpdateLineItemInCartWorkflowInputDTO,
  UpdateLineItemWithoutSelectorDTO,
} from "@medusajs/framework/types";
import {
  BigNumber,
  MathBN,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { buildItemSignature } from "../utils/variant-addon-signature";
import {
  createAddonVariantLinkedEntityMap,
  prepareAddonVariantItem,
} from "../utils/helpers";
import { updateLineItemInCartWorkflow } from "@medusajs/medusa/core-flows";

export const getAddonLineItemActionsStepId = "get-addon-line-item-actions-step";

interface GetAddonLineItemActionsStepInput {
  cart_id: string;
  addonVariantsMap: ReturnType<typeof createAddonVariantLinkedEntityMap>;
  items: Array<{
    variant_id: string;
    addon_variants: Array<{
      id: string;
      quantity?: number;
      metadata?: Record<string, unknown> | null;
    }>;
    quantity: number;
    metadata?: Record<string, unknown> | null;
  }>;
}
export const getAddonLineItemActionsStep = createStep(
  getAddonLineItemActionsStepId,
  async (input: GetAddonLineItemActionsStepInput, { container }) => {
    const cartModule = container.resolve<ICartModuleService>(Modules.CART);

    const lineItems = await cartModule.listLineItems({
      cart_id: input.cart_id,
    });

    const addonItemsToCreate: CreateLineItemForCartDTO[] = [];
    const addonItemsToUpdate: UpdateLineItemWithoutSelectorDTO[] = [];
    const variantsToCreate: CreateCartCreateLineItemDTO[] = [];
    const variantsToUpdate: UpdateLineItemDTO[] = [];
    const lineItemMap = new Map(
      lineItems.map((li) => {
        return [
          `${li.metadata?.variant_addon_sig as string}-${
            li.variant_id ?? li.metadata?.addon_variant_id
          }`,
          li,
        ];
      })
    );

    for (const inputItemGroup of input.items) {
      const inputItemSignature = buildItemSignature(inputItemGroup);
      let variantQuantity = inputItemGroup.quantity as any;
      const existingVariantItem = lineItemMap.get(
        `${inputItemSignature}-${inputItemGroup.variant_id}`
      );
      if (existingVariantItem) {
        variantQuantity = MathBN.sum(
          existingVariantItem.quantity,
          variantQuantity
        );
        variantsToUpdate.push({
          id: existingVariantItem.id,
          cart_id: input.cart_id,
          quantity: variantQuantity,
          metadata: {
            variant_addon_sig: inputItemSignature,
          },
        });
      } else {
        variantsToCreate.push({
          variant_id: inputItemGroup.variant_id,
          quantity: variantQuantity,
          metadata: {
            variant_addon_sig: inputItemSignature,
          },
        });
      }

      inputItemGroup.addon_variants.map((av) => {
        const existingItem = lineItemMap.get(`${inputItemSignature}-${av.id}`);

        if (existingItem) {
          const existingAddonQuantity =
            (existingItem?.metadata?.addon_variant_quantity as
              | number
              | undefined) ?? 1;
          const newAddonQuantity = av.quantity ?? existingAddonQuantity;
          const newQuantityWithoutScale = variantQuantity
          const scaledQuantity = MathBN.mult(
            newQuantityWithoutScale,
            newAddonQuantity
          );
          addonItemsToUpdate.push({
            ...existingItem,
            quantity: scaledQuantity,
            metadata: {
              ...existingItem.metadata,
              addon_variant_quantity: newAddonQuantity,
            },
          });
        } else {
          const addonVariantData = input.addonVariantsMap[av.id];
          const addonQuantity = av.quantity ?? 1;
          if (!addonVariantData) {
            // This should never happen, but just in case
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Addon variant ${av.id} not found`
            );
          }

          addonItemsToCreate.push(
            prepareAddonVariantItem({
              item: {
                cart_id: input.cart_id,
                unit_price: 0,
                quantity: MathBN.mult(variantQuantity, addonQuantity),
              },
              addonVariantData,
              signature: inputItemSignature,
              addonQuantity: addonQuantity,
            })
          );
        }
        return existingItem;
      });
    }

    return new StepResponse({
      addonItemsToCreate,
      addonItemsToUpdate,
      variantsToCreate,
      variantsToUpdate,
    });
  }
);
