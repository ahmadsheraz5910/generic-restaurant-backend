import { model } from "@medusajs/framework/utils"
import Addon from "./addon"

const AddonVariant = model
  .define("AddonVariant", {
    id: model.id({ prefix: "addonVariant" }).primaryKey(),
    title: model.text().searchable(),
    manage_inventory: model.boolean().default(true),
    metadata: model.json().nullable(),
    variant_rank: model.number().default(0).nullable(),
    addon: model
      .belongsTo(() => Addon, {
        mappedBy: "variants",
      })
      .searchable()
      .nullable()
  })
  .indexes([
    {
      name: "IDX_addon_variant_id_addon_id",
      on: ["id", "addon_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_addon_variant_addon_id",
      on: ["addon_id"],
      where: "deleted_at IS NULL",
    }
  ])

export default AddonVariant