import { model } from "@medusajs/framework/utils";
import Addon from "./addon";

const AddonGroup = model
  .define("AddonGroup", {
    id: model.id({ prefix: "aGroup" }).primaryKey(),
    title: model.text().searchable(),
    handle: model.text(),
    metadata: model.json().nullable(),
    addons: model.hasMany(() => Addon, {
      mappedBy: "addonGroup",
    }),
  })
  .indexes([
    {
      name: "IDX_addonGroup_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export default AddonGroup;
