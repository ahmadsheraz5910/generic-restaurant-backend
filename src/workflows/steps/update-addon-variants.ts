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

export type UpdateAddonVariantsStepInput =
  | {
      selector: AddonModuleTypes.FilterableAddonVariantProps;
      update: AddonModuleTypes.UpdateAddonVariantDTO;
    }
  | {
      addon_variants: AddonModuleTypes.UpsertAddonVariantDTO[];
    };

export const updateAddonVariantsStepId = "update-addon-variants";

export const updateAddonVariantsStep = createStep(
  updateAddonVariantsStepId,
  async (data: UpdateAddonVariantsStepInput, { container }) => {
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    if ("addon_variants" in data) {
      if (data.addon_variants.some((p) => !p.id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Addon Variant ID is required when doing a batch update of addon variants"
        );
      }

      if (!data.addon_variants.length) {
        return new StepResponse([], []);
      }

      const prevData = await service.listAddonVariants({
        id: data.addon_variants.map((p) => p.id) as string[],
      });

      const addonVariants = await service.upsertAddonVariants(
        data.addon_variants
      );
      return new StepResponse(addonVariants, prevData);
    }
    const { selects } = getSelectsAndRelationsFromObjectArray([data.update]);
    const prevData = await service.listAddonVariants(data.selector, {
      select: selects,
    });
    const addonVariants = await service.updateAddonVariants({
      selector: data.selector,
      data: data.update,
    });
    return new StepResponse(addonVariants, prevData);
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return;
    }
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    await service.upsertAddonVariants(
      prevData.map((r) => ({
        ...(r as unknown as AddonModuleTypes.UpdateAddonVariantDTO),
      }))
    );
  }
);
