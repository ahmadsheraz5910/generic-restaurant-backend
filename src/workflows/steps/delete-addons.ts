import type { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";
import AddonModuleService from "../../modules/addon/service";

export type DeleteAddonsStepInput = string[];

export const deleteAddonsStepId = "delete-addons";
export const deleteAddonsStep = createStep(
  deleteAddonsStepId,
  async (ids: DeleteAddonsStepInput, { container }) => {
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);

    await service.softDeleteAddons(ids);
    return new StepResponse(void 0, ids);
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return;
    }
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    await service.restoreAddons(prevIds);
  }
);
