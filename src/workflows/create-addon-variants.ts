import {
  AdditionalData,
  InventoryTypes,
  LinkDefinition,
  PricingTypes,
  ProductTypes,
} from "@medusajs/framework/types";
import {
  MedusaError,
  Modules,
  ProductVariantWorkflowEvents,
} from "@medusajs/framework/utils";
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE, AddonModuleTypes } from "../modules/addon";
import { createAddonVariantsStep } from "./steps/create-addon-variants";
import {
  createInventoryItemsWorkflow,
  createLinksWorkflow,
  createPriceSetsStep,
  validateInventoryItemsForCreate,
} from "@medusajs/medusa/core-flows";
import { createAddonVariantPricingLinkStep } from "./steps/create-addon-variant-pricing-link";

const buildLink = (
  addon_variant_id: string,
  inventory_item_id: string,
  required_quantity: number
) => {
  return {
    [ADDON_MODULE]: { addon_variant_id },
    [Modules.INVENTORY]: { inventory_item_id: inventory_item_id },
    data: { required_quantity: required_quantity },
  } as LinkDefinition;
};

const validateVariantsDuplicateInventoryItemIds = (
  variantsData: {
    variantId: string;
    inventory_items: {
      inventory_item_id: string;
      required_quantity?: number;
    }[];
  }[]
) => {
  const erroredVariantIds: string[] = [];

  for (const variantData of variantsData) {
    const inventoryItemIds = variantData.inventory_items.map(
      (item) => item.inventory_item_id
    );
    const duplicatedInventoryItemIds = inventoryItemIds.filter(
      (id, index) => inventoryItemIds.indexOf(id) !== index
    );

    if (duplicatedInventoryItemIds.length) {
      erroredVariantIds.push(variantData.variantId);
    }
  }

  if (erroredVariantIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot associate duplicate inventory items to variant(s) ${erroredVariantIds.join(
        "\n"
      )}`
    );
  }
};

const buildLinksToCreate = (data: {
  createdVariants: AddonModuleTypes.AddonVariantDTO[];
  inventoryIndexMap: Record<number, InventoryTypes.InventoryItemDTO>;
  input: CreateAddonVariantsWorkflowInput;
}) => {
  let index = 0;
  const linksToCreate: LinkDefinition[] = [];

  validateVariantsDuplicateInventoryItemIds(
    (data.createdVariants ?? []).map((variant, index) => {
      const variantInput = data.input.addon_variants[index];
      const inventoryItems = variantInput.inventory_items || [];

      return {
        variantId: variant.id,
        inventory_items: inventoryItems,
      };
    })
  );

  for (const variant of data.createdVariants) {
    const variantInput = data.input.addon_variants[index];
    const shouldManageInventory = variant.manage_inventory;
    const hasInventoryItems = variantInput.inventory_items?.length;
    index += 1;

    if (!shouldManageInventory) {
      continue;
    }

    if (!hasInventoryItems) {
      const inventoryItem = data.inventoryIndexMap[index];

      linksToCreate.push(buildLink(variant.id, inventoryItem.id, 1));

      continue;
    }

    for (const inventoryInput of variantInput.inventory_items || []) {
      linksToCreate.push(
        buildLink(
          variant.id,
          inventoryInput.inventory_item_id,
          inventoryInput.required_quantity ?? 1
        )
      );
    }
  }

  return linksToCreate;
};

export type CreateAddonVariantsWorkflowInput = {
  addon_variants: (AddonModuleTypes.CreateAddonVariantDTO & {
    prices?: PricingTypes.CreateMoneyAmountDTO[];
  } & {
    inventory_items?: {
      inventory_item_id: string;
      required_quantity?: number;
    }[];
  })[];
};
export const createAddonVariantsWorkflowId = "create-addon-variants";
export const createAddonVariantsWorkflow = createWorkflow(
  createAddonVariantsWorkflowId,
  (input: WorkflowData<CreateAddonVariantsWorkflowInput>) => {
    const variantsWithoutPrices = transform({ input }, (data) =>
      data.input.addon_variants.map((v) => ({
        ...v,
        prices: undefined,
        inventory_items: undefined,
      }))
    );

    const createdVariants = createAddonVariantsStep(variantsWithoutPrices);

    // Note: We rely on the same order of input and output when creating variants here, make sure that assumption holds

    // Linking with Inventory
    const inventoryItemIds = transform(input, (data) => {
      return data.addon_variants
        .map((variant) => variant.inventory_items || [])
        .flat()
        .map((item) => item.inventory_item_id)
        .flat();
    });
    validateInventoryItemsForCreate(inventoryItemIds);
    const variantItemCreateMap = transform(
      { createdVariants, input },
      (data) => {
        let index = 0;
        const map: Record<number, InventoryTypes.CreateInventoryItemInput> = {};

        for (const variantCreated of data.createdVariants || []) {
          const variantInput = data.input.addon_variants[index];
          const shouldManageInventory = variantCreated.manage_inventory;
          const hasInventoryItems = variantInput.inventory_items?.length;
          index += 1;

          if (!shouldManageInventory || hasInventoryItems) {
            continue;
          }

          // Create a default inventory item if the above conditions arent met
          map[index] = {
            title: variantInput.title,
          };
        }

        return map;
      }
    );
    const createdInventoryItems = createInventoryItemsWorkflow.runAsStep({
      input: {
        items: transform(variantItemCreateMap, (data) => Object.values(data)),
      },
    });
    const inventoryIndexMap = transform(
      { createdInventoryItems, variantItemCreateMap },
      (data) => {
        const map: Record<number, InventoryTypes.InventoryItemDTO> = {};
        let inventoryIndex = 0;

        for (const variantIndex of Object.keys(data.variantItemCreateMap)) {
          map[variantIndex] = data.createdInventoryItems[inventoryIndex];
          inventoryIndex += 1;
        }
        return map;
      }
    );
    const linksToCreate = transform(
      { createdVariants, inventoryIndexMap, input },
      buildLinksToCreate
    );
    createLinksWorkflow.runAsStep({ input: linksToCreate });

    // Linking with Pricing
    const pricesToCreate = transform({ input, createdVariants }, (data) => {
      return data.createdVariants.map((v, i) => {
        return {
          prices: data.input.addon_variants[i]?.prices,
        };
      });
    });
    const createdPriceSets = createPriceSetsStep(pricesToCreate);
    const variantAndPriceSets = transform(
      { createdVariants, createdPriceSets },
      (data) => {
        return data.createdVariants.map((variant, i) => ({
          variant: variant,
          price_set: data.createdPriceSets[i],
        }));
      }
    );
    const variantAndPriceSetLinks = transform(
      { variantAndPriceSets },
      (data) => {
        return {
          links: data.variantAndPriceSets.map((entry) => ({
            addon_variant_id: entry.variant.id,
            price_set_id: entry.price_set.id,
          })),
        };
      }
    );
    createAddonVariantPricingLinkStep(variantAndPriceSetLinks);
    const response = transform(
      {
        variantAndPriceSets,
      },
      (data) => {
        return data.variantAndPriceSets.map((variantAndPriceSet) => ({
          ...variantAndPriceSet.variant,
          prices: variantAndPriceSet?.price_set?.prices || [],
        }));
      }
    );

    return new WorkflowResponse(response);
  }
);
