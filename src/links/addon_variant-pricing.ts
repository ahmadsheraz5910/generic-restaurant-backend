import { defineLink } from "@medusajs/framework/utils"
import AddonModule  from "../modules/addon"
import PricingModule from "@medusajs/medusa/pricing"

export default defineLink(
  AddonModule.linkable.addonVariant,
  PricingModule.linkable.priceSet
)