import { LinkWorkflowInput } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";

const batchLinkAddonsToAddonGroupStepId = "batch-link-addons-to-addonGroup";
export const batchLinkAddonsToAddonGroupStep = createStep(
  batchLinkAddonsToAddonGroupStepId,
  async (data: LinkWorkflowInput, { container }) => {
    const addonGroupId = data.id;
    const service = container.resolve(ADDON_MODULE);

    if (!data.add?.length && !data.remove?.length) {
      return new StepResponse(void 0, null);
    }

    const dbCollection = await service.retrieveAddonGroup(addonGroupId, {
      select: ["id", "addons.id"],
      relations: ["addons"],
    });
    const existingAddonIds = dbCollection.addons?.map((p) => p.id) ?? [];
    const toRemoveMap = new Map(data.remove?.map((id) => [id, true]) ?? []);

    const newAddonIds = [
      ...existingAddonIds.filter((id) => !toRemoveMap.has(id)),
      ...(data.add ?? []),
    ];

    await service.updateAddonGroupsDeep(addonGroupId, {
      addon_ids: newAddonIds,
    });

    return new StepResponse(void 0, {
      id: data.id,
      addonIds: existingAddonIds,
    });
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return;
    }
    const service = container.resolve(ADDON_MODULE);

    await service.updateAddonGroupsDeep(prevData.id, {
      addon_ids: prevData.addonIds,
    });
  }
);
