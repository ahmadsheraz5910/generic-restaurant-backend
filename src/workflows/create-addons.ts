import { PricingTypes } from "@medusajs/framework/types";
import { isPresent, ProductUtils } from "@medusajs/framework/utils";
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { createAddonsStep } from "./steps/create-addons";
import {
  createAddonVariantsWorkflow,
  CreateAddonVariantsWorkflowInput,
} from "./create-addon-variants";

export type CreateAddonsWorkflowInput = {
  addons: {
    id?: string;
    title: string;
    thumbnail?: string | null;
    handle?: string;
    status?: ProductUtils.ProductStatus;
    variants?: {
      addon_id?: string;
      title: string;
      manage_inventory?: boolean;
      inventory_items?: {
        inventory_item_id: string;
        required_quantity?: number;
      }[];
      prices?: PricingTypes.CreateMoneyAmountDTO[];
    }[];
    addon_group_id?: string | null;
  }[];
};

export const createAddonsWorkflowId = "create-addons";

export const createAddonsWorkflow = createWorkflow(
  createAddonsWorkflowId,
  (input: WorkflowData<CreateAddonsWorkflowInput>) => {
    const addonWithoutExternalRelations = transform({ input }, (data) => {
      return data.input.addons.map((p) => {
        return {
          ...p,
          variants: undefined,
        };
      });
    });
    const createdAddons = createAddonsStep(addonWithoutExternalRelations);

    const variantsInput = transform({ input, createdAddons }, (data) => {
      const addonVariants: CreateAddonVariantsWorkflowInput["addon_variants"] =
        [];
      data.createdAddons.forEach((addon, i) => {
        const inputAddon = data.input.addons[i];

        for (const inputVariant of inputAddon.variants || []) {
          isPresent(inputVariant) &&
            addonVariants.push({
              addon_id: addon.id,
              ...inputVariant,
            });
        }
      });
      return {
        input: { addon_variants: addonVariants },
      };
    });

    const createdVariants =
      createAddonVariantsWorkflow.runAsStep(variantsInput);

    const response = transform(
      { createdVariants, input, createdAddons },
      (data) => {
        const variantMap: Record<string, typeof createdVariants> = {};

        for (const variant of data.createdVariants) {
          const array = variantMap[variant.addon_id!] || [];
          array.push(variant);
          variantMap[variant.addon_id!] = array;
        }

        for (const product of data.createdAddons) {
          product.variants = variantMap[product.id] || [];
        }

        return data.createdAddons;
      }
    );
    return new WorkflowResponse(response);
  }
);
