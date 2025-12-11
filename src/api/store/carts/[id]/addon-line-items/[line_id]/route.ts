import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { HttpTypes } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { deleteVariantAddonGroupInCartWorkflowId } from "../../../../../../workflows/addon-cart/delete-variant-addon-group";
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers";
import { StoreUpdateCartAddonLineItemType } from "../validators";
import { updateVariantAddonGroupInCartWorkflowId } from "../../../../../../workflows/addon-cart/update-variant-addon-group-in-cart";


export const POST = async (
  req: MedusaRequest<StoreUpdateCartAddonLineItemType, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const id = req.params.line_id;
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(updateVariantAddonGroupInCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      item: {
        id,
        ...req.body,
      },
    }
  });

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ cart });
};


export const DELETE = async (
  req: MedusaRequest<{}, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const id = req.params.line_id;
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE);
  await we.run(deleteVariantAddonGroupInCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      ids: [id],
    },
  });

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ cart });
};
