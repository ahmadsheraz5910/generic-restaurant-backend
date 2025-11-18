import { PricingTypes } from "@medusajs/framework/types";
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { AddonModuleTypes } from "../modules/addon";
import { updateAddonVariantsStep } from "./steps/update-addon-variants";
import { getAddonVariantPricingLinkStep } from "./steps/get-addon-variant-pricing-link";
import { updatePriceSetsStep } from "@medusajs/medusa/core-flows";

export type UpdateAddonVariantsWorkflowInputDTO =
  AddonModuleTypes.UpdateAddonVariantDTO & {
    prices?: (PricingTypes.CreateMoneyAmountDTO | PricingTypes.UpdateMoneyAmountDTO)[];
  };
export type UpsertAddonVariantsWorkflowInputDTO =
  AddonModuleTypes.UpsertAddonVariantDTO & {
    prices?: (PricingTypes.CreateMoneyAmountDTO | PricingTypes.UpdateMoneyAmountDTO)[];
  };
export type UpdateAddonVariantsWorkflowInput =
  | {
      selector: AddonModuleTypes.FilterableAddonVariantProps;
      update: UpdateAddonVariantsWorkflowInputDTO;
    }
  | {
      addon_variants: UpsertAddonVariantsWorkflowInputDTO[];
    };

export const updateAddonVariantsWorkflowId = "update-addon-variants";
export const updateAddonVariantsWorkflow = createWorkflow(
  updateAddonVariantsWorkflowId,
  (input: WorkflowData<UpdateAddonVariantsWorkflowInput>) => {
    const updateWithoutPrices = transform({ input }, (data) => {
      if ("addon_variants" in data.input) {
        return {
          addon_variants: data.input.addon_variants.map((variant) => {
            return {
              ...variant,
              prices: undefined,
            };
          }),
        };
      }

      return {
        selector: data.input.selector,
        update: {
          ...data.input.update,
          prices: undefined,
        },
      };
    });

    const updatedVariants = updateAddonVariantsStep(updateWithoutPrices);
    // We don't want to do any pricing updates if the prices didn't change
    const variantIds = transform({ input, updatedVariants }, (data) => {
      if ("addon_variants" in data.input) {
        const variantsWithPriceUpdates = new Set(
          data.input.addon_variants.filter((v) => !!v.prices).map((v) => v.id)
        );
        return data.updatedVariants
          .map((v) => v.id)
          .filter((id) => variantsWithPriceUpdates.has(id));
      }
      if (!data.input.update.prices) {
        return [];
      }

      return data.updatedVariants.map((v) => v.id);
    });

    const variantPriceSetLinks = getAddonVariantPricingLinkStep({
      ids: variantIds,
    });

    const pricesToUpdate = transform(
      { input, variantPriceSetLinks },
      (data) => {
        if (!data.variantPriceSetLinks.length) {
          return {};
        }

        if ("addon_variants" in data.input) {
          const priceSets = data.variantPriceSetLinks
            .map((link) => {
              if (!("addon_variants" in data.input)) {
                return;
              }

              const variant = data.input.addon_variants.find(
                (v) => v.id === link.addon_variant_id
              )!;

              return {
                id: link.price_set_id,
                prices: variant.prices,
              } as PricingTypes.UpsertPriceSetDTO;
            })
            .filter(Boolean);

          return { price_sets: priceSets };
        }

        return {
          selector: {
            id: data.variantPriceSetLinks.map((link) => link.price_set_id),
          } as PricingTypes.FilterablePriceSetProps,
          update: {
            prices: data.input.update.prices,
          } as PricingTypes.UpdatePriceSetDTO,
        };
      }
    );

    const updatedPriceSets = updatePriceSetsStep(pricesToUpdate);

    // We want to correctly return the variants with their associated price sets and the prices coming from it
    const response = transform(
      {
        variantPriceSetLinks,
        updatedVariants,
        updatedPriceSets,
      },
      (data) => {
        return data.updatedVariants.map((variant) => {
          const linkForVariant = data.variantPriceSetLinks?.find(
            (link) => link.addon_variant_id === variant.id
          );

          const priceSetForVariant = data.updatedPriceSets?.find(
            (priceSet) => priceSet.id === linkForVariant?.price_set_id
          );

          return { ...variant, price_set: priceSetForVariant };
        });
      }
    );
    return new WorkflowResponse(response);
  }
);
