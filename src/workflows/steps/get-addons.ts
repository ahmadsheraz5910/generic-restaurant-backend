import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";
import AddonModuleService from "../../modules/addon/service";

export type GetAddonsStepInput = {
  ids?: string[];
};

export const getAddonsStepId = "get-addons";
export const getAddonsStep = createStep(
  getAddonsStepId,
  async (data: GetAddonsStepInput, { container }) => {
    const service = container.resolve<AddonModuleService>(ADDON_MODULE);
    if (!data.ids?.length) {
      return new StepResponse([], []);
    }

    const products = await service.listAddons(
      { id: data.ids },
      { relations: ["variants"] }
    );
    return new StepResponse(products, products);
  }
);
