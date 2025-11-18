import {
  CreatePricesDTO,
  UpdatePricesDTO,
  CreatePriceSetDTO,
} from "@medusajs/framework/types";
import { Modules, arrayDifference } from "@medusajs/framework/utils";
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createPriceSetsStep,
  removeRemoteLinkStep,
  updatePriceSetsStep,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows";
import { createAddonVariantPricingLinkStep } from "./steps/create-addon-variant-pricing-link";
import { ADDON_MODULE } from "../modules/addon";

/**
 * The data to create, update, or remove variants' prices.
 */
export type UpsertAddonVariantPricesWorkflowInput = {
  /**
   * The variants to create or update prices for.
   */
  addonVariantPrices: {
    /**
     * The ID of the variant to create or update prices for.
     */
    addon_variant_id: string;
    /**
     * The ID of the product the variant belongs to.
     */
    addon_id: string;
    /**
     * The prices to create or update for the variant.
     */
    prices?: (CreatePricesDTO | UpdatePricesDTO)[];
  }[];
  /**
   * The IDs of the variants to remove all their prices.
   */
  previousAddonVariantIds: string[];
};

export const upsertAddonVariantPricesWorkflowId = "upsert-addon_variant-prices";
/**
 * This workflow creates, updates, or removes variants' prices. It's used by the {@link updateProductsWorkflow}
 * when updating a variant's prices.
 *
 * You can use this workflow within your own customizations or custom workflows to manage the prices of a variant.
 *
 * @example
 * const { result } = await upsertAddonVariantPricesWorkflow(container)
 * .run({
 *   input: {
 *     AddonvariantPrices: [
 *       {
 *         variant_id: "variant_123",
 *         product_id: "prod_123",
 *         prices: [
 *           {
 *             amount: 10,
 *             currency_code: "usd",
 *           },
 *           {
 *             id: "price_123",
 *             amount: 20,
 *           }
 *         ]
 *       }
 *     ],
 *     // these are variants to remove all their prices
 *     // typically used when a variant is deleted.
 *     previousVariantIds: ["variant_321"]
 *   }
 * })
 *
 * @summary
 *
 * Create, update, or remove variants' prices.
 */
export const upsertAddonVariantPricesWorkflow = createWorkflow(
  upsertAddonVariantPricesWorkflowId,
  (
    input: WorkflowData<UpsertAddonVariantPricesWorkflowInput>
  ): WorkflowData<void> => {
    const { newVariants, existingVariants } = transform({ input }, (data) => {
      const previousMap = new Set(
        data.input.previousAddonVariantIds.map((v) => v)
      );
      return {
        existingVariants: data.input.addonVariantPrices.filter((v) =>
          previousMap.has(v.addon_variant_id)
        ),
        newVariants: data.input.addonVariantPrices.filter(
          (v) => !previousMap.has(v.addon_variant_id)
        ),
      };
    });
    const existingVariantIds = transform({ existingVariants }, (data) =>
      data.existingVariants.map((v) => v.addon_variant_id)
    );

    const existingLinks = useRemoteQueryStep({
      entry_point: "addon_variant_price_set",
      fields: ["addon_variant_id", "price_set_id"],
      variables: { filters: { addon_variant_id: existingVariantIds } },
    });

    const pricesToUpdate = transform(
      { existingVariants, existingLinks },
      (data) => {
        const linksMap = new Map(
          data.existingLinks.map((l) => [l.addon_variant_id, l.price_set_id])
        );
        return {
          price_sets: data.existingVariants
            .map((v) => {
              const priceSetId = linksMap.get(v.addon_variant_id);

              if (!priceSetId || !v.prices) {
                return;
              }

              return {
                id: priceSetId,
                prices: v.prices,
              };
            })
            .filter(Boolean),
        };
      }
    );

    updatePriceSetsStep(pricesToUpdate);

    // // Note: We rely on the same order of input and output when creating variants here, make sure that assumption holds
    const pricesToCreate = transform({ newVariants }, (data) => {
      return data.newVariants.map((v) => {
        return {
          prices: v.prices,
        } as CreatePriceSetDTO;
      });
    });
    const createdPriceSets = createPriceSetsStep(pricesToCreate);

    const variantAndPriceSetLinks = transform(
      { newVariants, createdPriceSets },
      (data) => {
        return {
          links: data.newVariants.map((variant, i) => ({
            addon_variant_id: variant.addon_variant_id,
            price_set_id: data.createdPriceSets[i].id,
          })),
        };
      }
    );

    createAddonVariantPricingLinkStep(variantAndPriceSetLinks);
  }
);
