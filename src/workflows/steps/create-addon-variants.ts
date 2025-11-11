import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ADDON_MODULE, AddonModuleTypes } from "../../modules/addon"

export const createAddonVariantsStepId = "create-addon-variants"
export const createAddonVariantsStep = createStep(
  createAddonVariantsStepId,
  async (data: AddonModuleTypes.CreateAddonVariantDTO[], { container }) => {
    const service = container.resolve(ADDON_MODULE)
    const created = await service.createAddonVariants(data)
    return new StepResponse(
      created,
      created.map((addonVariant) => addonVariant.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve(ADDON_MODULE)
    await service.deleteAddonVariants(createdIds)
  }
)