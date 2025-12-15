import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { createAddonVariantLinkedEntityMap } from "../utils/helpers";
/**
 * Step to validate that addon variants are valid for the given product variants in the line items.
 * It checks that each addon variant is linked to the product associated with the variant, by
 * verifying the addon group linkage.
 *
 */
export const validateAddonLineItemsStepId = "validate-addon-line-items";
export interface ValidateAddonLineItemsStepInput {
  addonVariantsMap: ReturnType<typeof createAddonVariantLinkedEntityMap>;
  items: Array<{
    variant_id: string;
    quantity?: number;
    metadata?: Record<string, unknown> | null;
    addon_variants: Array<{
      id: string;
      quantity?: number;
      metadata?: Record<string, unknown> | null;
    }>;
  }>;
}
export const requiredVariantFieldsForAddonValidation = [
  "id",
  "product",
  "product.addon_groups.id",
  "product.addon_groups.addons.id",
  "product.addon_groups.addons.variants.id",
];
export const requiredVariantAddonFields = [
  "product.addon_groups.title",
  "product.addon_groups.handle",
  "product.addon_groups.addons.title",
  "product.addon_groups.addons.handle",
  "product.addon_groups.addons.thumbnail",
  "product.addon_groups.addons.variants.title",
];
export const validateAddonLineItemsStep = createStep(
  validateAddonLineItemsStepId,
  async (input: ValidateAddonLineItemsStepInput) => {
    // Check that each addon variant is linked to the product associated with the variant
    const invalidCombinations: string[] = [];
    for (const item of input.items) {
      const variantId = item.variant_id;
      const addonVariantIds = item.addon_variants.map((av) => av.id);
      const invalidCombination = addonVariantIds.filter(
        (avId) => input.addonVariantsMap[avId]?.variant.id !== variantId
      );
      if (invalidCombination.length > 0) {
        invalidCombinations.push(
          `variant ${variantId} has invalid addon variants: ${invalidCombination.join(
            ", "
          )}`
        );
      }
    }
    if (invalidCombinations.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        invalidCombinations.join("\n")
      );
    }

    return new StepResponse(void 0);
  }
);
