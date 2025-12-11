import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import { Modules } from "@medusajs/utils";
import { StoreAddCartAddonLineItemType } from "./validators";
import { addVariantAddonGroupToCartWorkflowId } from "../../../../../workflows/addon-cart/add-variant-addon-group-to-cart";
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers";

export const POST = async (
  req: MedusaRequest<StoreAddCartAddonLineItemType, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(addVariantAddonGroupToCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      items: [req.body],
    }
  });

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ cart });
};
