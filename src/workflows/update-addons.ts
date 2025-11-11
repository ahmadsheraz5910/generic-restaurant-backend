import { InferEntityType } from "@medusajs/framework/types";
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { AddonModuleTypes } from "../modules/addon";
import { updateAddonsStep } from "./steps/update-addons";
import {
  UpdateAddonVariantsWorkflowInputDTO,
  UpsertAddonVariantsWorkflowInputDTO,
} from "./update-addon-variants";
import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import Addon from "../modules/addon/models/addon";
import {
  normalizeUpdateInput,
  transformUpdateInput,
} from "../utils/transform-update-input";
import { upsertAddonVariantPricesWorkflow } from "./upsert-addon_variant-prices";

export type UpdateAddonsWorkflowInputSelector = {
  selector: AddonModuleTypes.FilterableAddonProps;
  update: AddonModuleTypes.UpdateAddonDTO & {
    variants?: UpdateAddonVariantsWorkflowInputDTO[];
  };
};
export type UpdateAddonsWorkflowInputProducts = {
  addons: (AddonModuleTypes.UpsertAddonDTO & {
    variants?: UpsertAddonVariantsWorkflowInputDTO[];
  })[];
};
export type UpdateAddonsWorkflowInput =
  | UpdateAddonsWorkflowInputSelector
  | UpdateAddonsWorkflowInputProducts;

export const updateAddonsWorkflowId = "update-addons";
/**
 * case 1: update addons
 * case 2: update addons with variants
 * case 2.1: update addons with old variants
 * case 2.2: update addons with new variants
 * case 2.3: update addons with new variants and old variants updated
 * case 3: update addons with variants and prices
 */
export const updateAddonsWorkflow = createWorkflow(
  updateAddonsWorkflowId,
  (input: WorkflowData<UpdateAddonsWorkflowInput>) => {
    // We only get the ids of addons that are updating the variants.
    const selectorForAddonsWithExistingVariants = transform({ input }, (data) => {
      if ("addons" in data.input) {
        return {
          filters: {
            id: data.input.addons.filter((p) => !!p.variants).map((p) => p.id),
          },
        };
      }
      return {
        filters: data.input.update?.variants ? data.input.selector : { id: [] },
      };
    });
    const addonsWithExistingVariants = useRemoteQueryStep({
      entry_point: "addon",
      fields: ["variants.id"],
      variables: selectorForAddonsWithExistingVariants,
    }).config({ name: "get-previous-addon-variants-step" });
    const previousAddonVariantIds = transform(
      { addonsWithExistingVariants },
      (data) => {
        return data.addonsWithExistingVariants.flatMap((p) =>
          p.variants?.map((v) => v.id)
        );
      }
    );

    // Update Addon without updating prices, as it is linked as a seperate module
    const toUpdateInput = transform({ input }, (data) =>
      transformUpdateInput(data.input, "addons", (data) => ({
        ...data,
        variants: data.variants?.map(v => ({
          ...v,
          prices: undefined,
        })),
      }))
    );
    const updatedAddons = updateAddonsStep(toUpdateInput);

    const addonVariantPrices = transform(
      { input, updatedAddons },
      prepareVariantPrices
    );
    upsertAddonVariantPricesWorkflow.runAsStep({
      input: {
        addonVariantPrices,
        previousAddonVariantIds
      },
    });

    return new WorkflowResponse(updatedAddons);
  }
);

function prepareVariantPrices({
  input,
  updatedAddons,
}: {
  updatedAddons: InferEntityType<typeof Addon>[];
  input: UpdateAddonsWorkflowInput;
}) {
  const { data } = normalizeUpdateInput(input, "addons");
  return data.flatMap((addon, i) => {
    const updatedAddon = updatedAddons[i];
    return (
      addon.variants?.map((variant, j) => {
        
        const updatedVariant = updatedAddon.variants[j];
        return {
          addon_id: updatedAddon.id,
          addon_variant_id: updatedVariant.id,
          prices: variant.prices,
        };
      }) ?? []
    );
  });
}
