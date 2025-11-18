import { Module } from "@medusajs/framework/utils"
import AddonModuleService from "./service"
export * as AddonModuleTypes from "./types"
export const ADDON_MODULE = "addon"
export default Module(ADDON_MODULE, {
  service: AddonModuleService,
})
