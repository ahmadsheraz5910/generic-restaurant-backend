import { model, ProductUtils } from "@medusajs/framework/utils";
import AddonGroup from "./addon-group";
import AddonVariant from "./addon-variant";

const Addon = model
  .define("Addon", {
    id: model.id({ prefix: "addon" }).primaryKey(),
    title: model.text().searchable(),
    handle: model.text(),
    status: model
      .enum(ProductUtils.ProductStatus)
      .default(ProductUtils.ProductStatus.DRAFT),
    thumbnail: model.text().nullable(),
    metadata: model.json().nullable(),
    variants: model.hasMany(() => AddonVariant, {
      mappedBy: "addon",
    }),
    addonGroup: model
      .belongsTo(() => AddonGroup, {
        mappedBy: "addons",
      })
      .nullable(),
  })
  .indexes([
    {
      name: "IDX_addon_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_addon_status",
      on: ["status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);

export default Addon;
