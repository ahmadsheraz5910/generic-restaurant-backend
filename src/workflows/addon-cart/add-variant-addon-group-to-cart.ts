import {
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  addToCartWorkflow,
  confirmVariantInventoryWorkflow,
  CreateLineItemsCartStepInput,
  createLineItemsStep,
  emitEventStep,
  refreshCartItemsWorkflow,
  releaseLockStep,
  updateLineItemInCartWorkflow,
  updateLineItemsStep,
  UpdateLineItemsStepInput,
  useQueryGraphStep,
  validateCartStep,
} from "@medusajs/medusa/core-flows";
import {
  requiredVariantAddonFields,
  requiredVariantFieldsForAddonValidation,
  validateAddonLineItemsStep,
} from "./steps/validate-addon-line-items";
import { getAddonLineItemActionsStep } from "./steps/get-addon-line-item-actions-step";
import { getAddonVariantPricingStep } from "../steps/get-addon-variant-prices";
//import { cartFieldsForPricingContext } from "./utils/fields";
import {
  CartWorkflowEvents,
  deduplicate,
  isDefined,
  MedusaError,
} from "@medusajs/framework/utils";
import { createAddonVariantLinkedEntityMap } from "./utils/helpers";
import {
  cartFieldsForPricingContext,
  productVariantsFields,
  requiredVariantFieldsForInventoryConfirmation,
} from "./utils/fields";
import { getVariantItemsWithPricesWorkflow } from "./steps/get-variant-items-with-prices";
import {
  ConfirmVariantInventoryWorkflowInputDTO,
  CreateLineItemForCartDTO,
} from "@medusajs/framework/types";
import { getAddonVariantItemsWithPricingWorkflow } from "./steps/get-addon-variant-items-with-prices-step";

interface AddVariantAddonGroupToCartWorkflowInputDTO {
  cart_id: string;
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
export const addVariantAddonGroupToCartWorkflowId =
  "add-variant-addon-group-to-cart";
export const addVariantAddonGroupToCartWorkflow = createWorkflow(
  {
    name: addVariantAddonGroupToCartWorkflowId,
    idempotent: false,
  },
  (input: AddVariantAddonGroupToCartWorkflowInputDTO) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    });

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: cartFieldsForPricingContext,
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart" });

    validateCartStep({ cart: cart as any });

    const variantInputItems = transform(input.items, (data) =>
      data.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }))
    );

    const { data: variantsData } = useQueryGraphStep({
      entity: "variant",
      filters: {
        id: transform(variantInputItems, (data): string[] =>
          data.map((i) => i.variant_id)
        ),
      },
      fields: deduplicate([
        ...productVariantsFields,
        ...requiredVariantFieldsForAddonValidation,
        ...requiredVariantAddonFields,
        ...requiredVariantFieldsForInventoryConfirmation,
      ]),
      options: { throwIfKeyNotFound: true, isList: true },
    }).config({ name: "fetch-variants" });

    const addonVariantsMap = transform(variantsData, (data) =>
      createAddonVariantLinkedEntityMap(data as any)
    );

    validateAddonLineItemsStep({
      addonVariantsMap: addonVariantsMap,
      items: input.items,
    });

    const {
      variantsToUpdate = [],
      variantsToCreate = [],
      addonItemsToCreate = [],
      addonItemsToUpdate = [],
    } = getAddonLineItemActionsStep({
      cart_id: input.cart_id,
      items: input.items,
      addonVariantsMap,
    });

    // New line items price calculation
    const variantItemsToCreateWithPrice = when(
      "should-calculate-variant-prices",
      variantsToCreate,
      (data) => !!data.length
    ).then(() => {
      const items = getVariantItemsWithPricesWorkflow.runAsStep({
        input: {
          inputVariantItems: variantsToCreate as any,
          cart: cart as any,
          variants: variantsData as any,
        },
      });
      return items as CreateLineItemForCartDTO[];
    });

    const addonVariantItemsToCreateWithPrice = when(
      "should-calculate-addon-prices",
      addonItemsToCreate,
      (data) => !!data.length
    ).then(() => {
      const items = getAddonVariantItemsWithPricingWorkflow.runAsStep({
        input: {
          items: addonItemsToCreate,
          cart: cart as any,
        },
      });
      return items;
    });

    //Inventory confirmation
    const itemsToConfirmInventory = transform(
      { variantsToUpdate, variantsToCreate },
      (data) => {
        return (data.variantsToUpdate as []).concat(
          data.variantsToCreate as []
        );
      }
    );
    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: cart.sales_channel_id!,
        variants:
          variantsData as unknown as ConfirmVariantInventoryWorkflowInputDTO["variants"],
        itemsToUpdate:
          itemsToConfirmInventory as unknown as ConfirmVariantInventoryWorkflowInputDTO["itemsToUpdate"],
        items: variantInputItems,
      },
    });

    // Parallelize line item updates and creations
    const itemsToUpdate = transform(
      { variantsToUpdate, addonItemsToUpdate },
      (data) => {
        return data.variantsToUpdate.concat(data.addonItemsToUpdate as any);
      }
    );

    const itemsToCreate = transform(
      { variantItemsToCreateWithPrice, addonVariantItemsToCreateWithPrice },
      (data) => {
        return (data.variantItemsToCreateWithPrice ?? []).concat(
          (data.addonVariantItemsToCreateWithPrice ?? []) as any
        );
      }
    );

    const [createdLineItems, updatedLineItems] = parallelize(
      updateLineItemsStep({
        id: input.cart_id,
        items: itemsToUpdate as unknown as UpdateLineItemsStepInput["items"],
      }),
      createLineItemsStep({
        id: input.cart_id,
        items:
          itemsToCreate as unknown as CreateLineItemsCartStepInput["items"],
      })
    );

    const allItems = transform(
      { createdLineItems, updatedLineItems },
      ({ createdLineItems = [], updatedLineItems = [] }) => {
        return createdLineItems.concat(updatedLineItems);
      }
    );

    refreshCartItemsWorkflow.runAsStep({
      input: {
        cart_id: cart.id,
        items: allItems,
      },
    });

    parallelize(
      emitEventStep({
        eventName: CartWorkflowEvents.UPDATED,
        data: { id: cart.id },
      }),
      releaseLockStep({
        key: cart.id,
      })
    );
    return new WorkflowResponse(itemsToCreate);
  }
);
