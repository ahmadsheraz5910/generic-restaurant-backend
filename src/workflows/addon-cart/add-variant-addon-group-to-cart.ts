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
  createLineItemsStep,
  releaseLockStep,
  updateLineItemsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import {
  requiredVariantFieldsForAddonValidation,
  validateAddonLineItemsStep,
} from "./steps/validate-addon-line-items";
import { getAddonLineItemActionsStep } from "./steps/get-addon-line-item-actions-step";
import { getAddonVariantPricingStep } from "../steps/get-addon-variant-prices";
import { cartFieldsForPricingContext } from "./utils/fields";
import { deduplicate, MedusaError } from "@medusajs/framework/utils";
import { createAddonVariantLinkedEntityMap } from "./utils/helpers";

interface AddVariantAddonGroupToCartWorkflowInputDTO {
  cart_id: string;
  items: {
    variant_id: string;
    addon_variants: Array<{
      id: string;
      quantity?: number;
      metadata?: Record<string, unknown> | null;
    }>;
    quantity: number;
    metadata?: Record<string, unknown> | null;
  }[];
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

    // Addons and variants validation
    const { data: variantsData } = useQueryGraphStep({
      entity: "variant",
      filters: {
        id: transform(input.items, (data) => data.map((i) => i.variant_id)),
      },
      fields: [
        "id",
        "product",
        "product.title",
        "product.handle",
        "product.addon_groups.id",
        "product.addon_groups.title",
        "product.addon_groups.handle",
        "product.addon_groups.addons.id",
        "product.addon_groups.addons.thumbnail",
        "product.addon_groups.addons.title",
        "product.addon_groups.addons.variants.id",
      ],
      options: { throwIfKeyNotFound: true, isList: true },
    });

    const addonVariantsMap = transform(variantsData, (data) =>
      createAddonVariantLinkedEntityMap(data as any)
    );

    validateAddonLineItemsStep({
      addonVariantsMap: addonVariantsMap,
      items: input.items,
    });

    // Handling addon line items
    const {
      variantsToCreate = [],
      addonItemsToCreate = [],
      addonItemsToUpdate = [],
    } = getAddonLineItemActionsStep({
      cart_id: input.cart_id,
      items: input.items,
      addonVariantsMap,
    });

    // Handling variant line items
    addToCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: variantsToCreate,
      },
    });

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: cartFieldsForPricingContext,
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart" });

    const cartPricingContext = {
      currency_code: cart.currency_code ?? cart.region?.currency_code,
      region_id: cart.region_id,
      region: cart.region,
      customer_id: cart.customer_id,
      customer: cart.customer,
    } as unknown as Record<string, string | number>;

    const addonVariantsWithPrice = when(
      "should-calculate-addon-prices",
      { cartPricingContext, addonItemsToCreate },
      (data) => !!data.addonItemsToCreate.length
    ).then(() =>
      getAddonVariantPricingStep({
        addon_variant_ids: transform(addonItemsToCreate, (data) =>
          data.map((i) => i.metadata?.addon_variant_id as string)
        ),
        context: cartPricingContext,
      })
    );

    parallelize(
      updateLineItemsStep({
        id: input.cart_id,
        items: addonItemsToUpdate,
      }),
      createLineItemsStep({
        id: input.cart_id,
        items: transform(
          { addonItemsToCreate, addonVariantsWithPrice },
          (data) =>
            data.addonItemsToCreate.map((i) => {
              const unit_price = data.addonVariantsWithPrice?.find(
                (avp) => avp.id === i.metadata?.addon_variant_id
              )?.calculated_price?.calculated_amount;
              return {
                ...i,
                unit_price: unit_price ?? 0,
              };
            })
        ),
      })
    );

    releaseLockStep({
      key: input.cart_id,
    });
    return new WorkflowResponse(void 0);
  }
);
