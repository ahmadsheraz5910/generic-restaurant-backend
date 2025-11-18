import { ProductTypes } from "@medusajs/framework/types";
import { getSelectsAndRelationsFromObjectArray } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE, AddonModuleTypes } from "../../modules/addon";

export type UpdateAddonGroupsStepInput = {
  selector: AddonModuleTypes.FilterableAddonGroupProps;
  update: AddonModuleTypes.UpdateAddonGroupDTO;
};

export const updateAddonGroupsStepId = "update-addon-groups";

export const updateAddonGroupsStep = createStep(
  updateAddonGroupsStepId,
  async (data: UpdateAddonGroupsStepInput, { container }) => {
    const service = container.resolve(ADDON_MODULE);

    const { selects, relations } = getSelectsAndRelationsFromObjectArray([
      data.update,
    ]);

    const prevData = await service.listAddonGroups(data.selector, {
      select: selects,
      relations,
    });

    const addonGroups = await service.updateAddonGroups(
      {
        selector:data.selector,
        data: data.update,
      }
    );
    return new StepResponse(addonGroups, { selector: data.selector, prevData });
  },
  async (prevData, { container }) => {
    if (!prevData?.prevData.length) {
      return;
    }
    const service = container.resolve(ADDON_MODULE);
    await service.updateAddonGroups({
      selector: prevData.selector,
      data: prevData.prevData.map((r) => ({
        ...(r as unknown as ProductTypes.UpdateProductCollectionDTO),
      })),
    });
  }
);
