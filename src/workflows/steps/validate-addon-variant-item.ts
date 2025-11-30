import {
  AdminProductVariant,
  InferEntityType,
} from "@medusajs/framework/types";
import { MedusaError, Modules, isPresent } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import AddonVariant from "../../modules/addon/models/addon-variant";
export interface ValidateAddonVariantLineItemStepInput {
  items: {
    variant_id: string;
    addon_variant_ids: string[];
    variant: AdminProductVariant;
    addonVariants: InferEntityType<typeof AddonVariant>[];
  }[];
}
export interface ValidateAddonVariantLineItemStepOutput {
  items: {
    variant_id: string;
    addon_variant_ids: string[];
  }[];
}
/**
 * Step to validate that addon variants are valid for the given product variants in the line items.
 * It checks that each addon variant is linked to the product associated with the variant, by
 * verifying the addon group linkage.
 *
 */
export const validateAddonVariantLineItemStepId =
  "validate-addon-variant-line-item";

export const validateAddonVariantLineItemStep = createStep(
  validateAddonVariantLineItemStepId,
  async (data: ValidateAddonVariantLineItemStepInput) => {
    if (!data.items?.length) {
      return;
    }

    const invalidCombinations: {
      addon_variant_id: string;
      variant_id: string;
    }[] = [];

    const outputItems: ValidateAddonVariantLineItemStepOutput["items"] =
      data.items.map((item) => {
        const { addonVariants, variant } = item;
        const variantProductId = variant.product_id;
        for (const av of addonVariants) {
          //@ts-ignore
          const addonProductId = av.addon.addonGroup.product_id;
          if (addonProductId !== variantProductId) {
            invalidCombinations.push({
              addon_variant_id: av.id,
              variant_id: variant.id,
            });
          }
        }
        return item;
      });

    if (invalidCombinations.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Combinations such as ${invalidCombinations
          .map(
            ({ addon_variant_id, variant_id }) =>
              `${addon_variant_id},${variant_id}`
          )
          .join(", ")} are invalid`
      );
    }
    return new StepResponse({ items: outputItems });
  }
);
