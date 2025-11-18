import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ADDON_MODULE, AddonModuleTypes } from "../../modules/addon"
import { kebabCase } from "@medusajs/framework/utils"

export const createAddonsStepId = "create-addons"
export const createAddonsStep = createStep(
  createAddonsStepId,
  async (data: AddonModuleTypes.CreateAddonDTO[], { container }) => {
    const service = container.resolve(ADDON_MODULE)
    const decorateAddonsData = data.map((addon) => {
      if (!addon.handle && addon.title) {
        addon.handle = kebabCase(addon.title)
      }
      return addon
    })
    const created = await service.createAddons(decorateAddonsData)
    return new StepResponse(
      created,
      created.map((product) => product.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve(ADDON_MODULE)
    await service.deleteAddons(createdIds)
  }
)