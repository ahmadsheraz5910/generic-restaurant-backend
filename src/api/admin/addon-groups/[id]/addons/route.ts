import { LinkMethodRequest } from "@medusajs/framework/types";
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { HttpTypes } from "../../../../../types/addons";
import { refetchAddonGroup } from "../../helpers";
import { batchLinkAddonsToAddonGroupWorkflow } from "../../../../../workflows/batch-link-addons-addon-group";

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.AdminAddonGroupResponse>
) => {
  const id = req.params.id;
  const { add = [], remove = [] } = req.validatedBody;

  const workflow = batchLinkAddonsToAddonGroupWorkflow(req.scope);
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  });

  const addon_group = await refetchAddonGroup(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({
    addon_group,
  });
};
