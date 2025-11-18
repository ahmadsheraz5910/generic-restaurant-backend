import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE, AddonModuleTypes } from "../../modules/addon";
import { kebabCase } from "@medusajs/framework/utils";

export type CreateAddonGroupStepInput = AddonModuleTypes.CreateAddonGroupDTO[];

export const createAddonGroupStep = createStep(
  "create-addon-groups-step",
  async (input: CreateAddonGroupStepInput, { container }) => {
    const addonModuleService = container.resolve(ADDON_MODULE);
    const addonGroupsToCreate = input.map((input) => {
      const handle = input.handle || kebabCase(input.title);
      return {
        title: input.title,
        handle,
        addons: input.addon_ids,
      };
    });
    const addonGroups = await addonModuleService.createAddonGroups(
      addonGroupsToCreate
    );
    return new StepResponse(
      addonGroups,
      addonGroups.map((a) => a.id)
    );
  },
  async (addon, { container }) => {
    if (!addon) {
      return;
    }
    const addonModuleService = container.resolve(ADDON_MODULE);
    await addonModuleService.deleteAddonGroups(addon);
  }
);
