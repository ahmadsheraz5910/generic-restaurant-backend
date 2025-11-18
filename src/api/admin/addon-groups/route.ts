import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AdminCreateAddonGroupType } from "./validators";
import { createAddonGroupsWorkflow } from "../../../workflows/create-addon-groups";
import { refetchAddonGroup } from "./helpers";
import { HttpTypes } from "../../../types/addons";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: addon_groups } = await remoteQuery.graph({
    entity: "addon_group",
    filters: req.filterableFields,
    ...req.queryConfig,
  });

  res.json({
    addon_groups,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAddonGroupType>,
  res: MedusaResponse<HttpTypes.AdminAddonGroupResponse>
) => {
  const { result } = await createAddonGroupsWorkflow(req.scope).run({
    input: { addonGroups: [req.validatedBody] },
  });

  const addon_group = await refetchAddonGroup(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ addon_group });
};
