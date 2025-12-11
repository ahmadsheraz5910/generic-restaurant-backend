import { StoreCart } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
/**
 * Step to validate that only items with variant_id are passed for updation
 */
export const validateVariantItemsOnlyStepId = "validate-variant-items-only";
export interface ValidateVariantItemsOnlyStepInput {
  items: Array<{
    id: string;
    variant_id: string;
  }>;
}
export const validateVariantItemsOnlyStep = createStep(
  validateVariantItemsOnlyStepId,
  async (input: ValidateVariantItemsOnlyStepInput) => {
    const nonVariantItemIds: Array<string> = [];
    for (const item of input.items) {
      if (!item.variant_id) {
        nonVariantItemIds.push(item.id);
      }
    }
    if (nonVariantItemIds.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Items with non-variantIds are found: ${nonVariantItemIds.join(", ")}`
      );
    }
    return new StepResponse(void 0);
  }
);
