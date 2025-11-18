import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";

export type DeleteAddonGroupsStepInput = string[];

export const deleteAddonGroupsStepId = "delete-addon-groups";
export const deleteAddonGroupsStep = createStep(
  deleteAddonGroupsStepId,
  async (ids: DeleteAddonGroupsStepInput, { container }) => {
    const service = container.resolve(ADDON_MODULE);
    await service.softDeleteAddonGroups(ids);
    return new StepResponse(void 0, ids);
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return;
    }
    const service = container.resolve(ADDON_MODULE);
    await service.restoreAddonGroups(prevIds);
  }
);
