import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types";
import {
  MedusaError,
  Modules,
  getSelectsAndRelationsFromObjectArray,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE, AddonModuleTypes } from "../../modules/addon";
import AddonModuleService from "../../modules/addon/service";

export type UpdateAddonsStepInput =
  | {
      selector: AddonModuleTypes.FilterableAddonProps;
      update: AddonModuleTypes.UpdateAddonDTO;
    }
  | {
      addons: AddonModuleTypes.UpsertAddonDTO[];
    };

export const updateAddonsStepId = "update-addons";
/**
 * This step updates one or more products.
 *
 * @example
 * To update products by their ID:
 *
 * ```ts
 * const data = updateProductsStep({
 *   products: [
 *     {
 *       id: "prod_123",
 *       title: "Shirt"
 *     }
 *   ]
 * })
 * ```
 *
 * To update products matching a filter:
 *
 * ```ts
 * const data = updateProductsStep({
 *   selector: {
 *     collection_id: "collection_123",
 *   },
 *   update: {
 *     material: "cotton",
 *   }
 * })
 * ```
 */
export const updateAddonsStep = createStep(
  updateAddonsStepId,
  async (data: UpdateAddonsStepInput, { container }) => {
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    if ("addons" in data) {
      if (data.addons.some((p) => !p.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Product ID is required when doing a batch update of products"
        );
      }

      if (!data.addons.length) {
        return new StepResponse([], []);
      }

      const prevData = await service.listAddons({
        id: data.addons.map((p) => p.id) as string[],
      });

      const products = await service.upsertAddons(data.addons);
      return new StepResponse(products, prevData);
    }


    const { selects } = getSelectsAndRelationsFromObjectArray([data.update]);
    const prevData = await service.listAddons(data.selector, {
      select: selects,
    });
    const products = await service.updateAddonsDeep(data.selector, data.update);
    return new StepResponse(products, prevData);
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return;
    }
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    await service.upsertAddons(
      prevData.map((r) => ({
        ...(r as any),
      }))
    );
  }
);
