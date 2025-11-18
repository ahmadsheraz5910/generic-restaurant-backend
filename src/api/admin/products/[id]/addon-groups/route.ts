import { HttpTypes, LinkMethodRequest } from "@medusajs/framework/types";
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http";
import {
  remapKeysForProduct,
  remapProductResponse,
} from "@medusajs/medusa/api/admin/products/helpers";
import { batchLinkAddonGroupsToProductWorkflow } from "../../../../../workflows/batch-link-addon-groups-product";

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const id = req.params.id;
  const { add = [], remove = [] } = req.validatedBody;
  const workflow = batchLinkAddonGroupsToProductWorkflow(req.scope);
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  });

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: id,
    scope: req.scope,
    fields: remapKeysForProduct(req.queryConfig.fields ?? []),
  });

  res.status(200).json({
    product: remapProductResponse(product as any),
  });
};
