import { defineLink } from "@medusajs/framework/utils";
import AddonModule from "../modules/addon";
import ProductModule from "@medusajs/medusa/product";

export default defineLink(
  {
    linkable: AddonModule.linkable.addonGroup,
    isList: true,
  },
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  }
);
