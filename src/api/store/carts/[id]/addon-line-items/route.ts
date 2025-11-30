import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers";
import {
  Modules,
} from "@medusajs/utils";
import { StoreAddCartAddonLineItemType } from "./validators";
import { addAddonItemToCartWorkflowId } from "../../../../../workflows/add-addon-item-to-cart";

export const POST = async (
  req: MedusaRequest<StoreAddCartAddonLineItemType, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(addAddonItemToCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      items: [req.validatedBody],
    },
    transactionId: "cart-add-addon-item-" + req.params.id,
  });

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ cart });
};
