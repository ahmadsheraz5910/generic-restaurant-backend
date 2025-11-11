import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ADDON_MODULE } from "../../modules/addon"

export type CreateAddonVariantPricingLinkStepInput = {
  links: {
    addon_variant_id: string
    price_set_id: string
  }[]
}

export const createAddonVariantPricingLinkStepId = "create-addonVariant-pricing-link"
export const createAddonVariantPricingLinkStep = createStep(
  createAddonVariantPricingLinkStepId,
  async (data: CreateAddonVariantPricingLinkStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
    await remoteLink.create(
      data.links.map((entry) => ({
        [ADDON_MODULE]: {
          addon_variant_id: entry.addon_variant_id,
        },
        [Modules.PRICING]: {
          price_set_id: entry.price_set_id,
        },
      }))
    )

    return new StepResponse(void 0, data)
  },
  async (data, { container }) => {
    if (!data?.links?.length) {
      return
    }

    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
    const links = data.links.map((entry) => ({
      [ADDON_MODULE]: {
        addon_variant_id: entry.addon_variant_id,
      },
      [Modules.PRICING]: {
        price_set_id: entry.price_set_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)