import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";
import AddonModuleService from "../../modules/addon/service";

export type DeleteAddonVariantsStepInput = string[];

export const deleteAddonVariantsStepId = "delete-addon-variants";
export const deleteAddonVariantsStep = createStep(
  deleteAddonVariantsStepId,
  async (ids: DeleteAddonVariantsStepInput, { container }) => {
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);

    await service.softDeleteAddonVariants(ids);
    return new StepResponse(void 0, ids);
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return;
    }
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);

    await service.restoreAddonVariants(prevIds);
  }
);
