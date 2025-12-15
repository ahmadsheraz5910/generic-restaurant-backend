import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  CartDTO,
  CreateLineItemDTO,
  CustomerDTO,
  RegionDTO,
} from "@medusajs/framework/types";
import { getAddonVariantPricingStep } from "../../steps/get-addon-variant-prices";

export type GetAddonVariantPricingWorkflowInput = {
  items: CreateLineItemDTO[];
  cart: Partial<CartDTO> & {
    region?: Partial<RegionDTO>;
    region_id?: string;
    customer?: Partial<CustomerDTO>;
    customer_id?: string;
  };
};

export const getAddonVariantItemsWithPricingWorkflowId =
  "get-addonVariant-items-with-pricing-workflow";

export const getAddonVariantItemsWithPricingWorkflow = createWorkflow(
  getAddonVariantItemsWithPricingWorkflowId,
  (input: GetAddonVariantPricingWorkflowInput) => {
    const addonVariantsWithPrices = getAddonVariantPricingStep({
      addon_variant_ids: transform(input.items, (data) =>
        data.map((i) => i.metadata?.addon_variant_id as string)
      ),
      cart: input.cart,
    });
    const items = transform(
      { items: input.items, addonVariantsWithPrices },
      (data) => {
        return data.items.map((i) => {
          const addonVariant = data.addonVariantsWithPrices?.find(
            (avp) => avp.id === i.metadata?.addon_variant_id
          );

          //@ts-ignore
          i.unit_price = addonVariant.calculated_price?.calculated_amount;
          return i;
        });
      }
    );
    return new WorkflowResponse(items);
  }
);
