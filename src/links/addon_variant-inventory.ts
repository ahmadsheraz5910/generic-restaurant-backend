import { defineLink } from "@medusajs/framework/utils";
import AddonModule from "../modules/addon";
import InventoryModule from "@medusajs/medusa/inventory";

export default defineLink(
  {
    linkable: AddonModule.linkable.addonVariant,
    isList: true,
  },
  {
    linkable: InventoryModule.linkable.inventoryItem,
    isList: true,
  }
);
