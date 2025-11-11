import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { AdminCreateAddonGroupType } from "./validators";
import { createAddonGroupsWorkflow } from "../../../workflows/create-addon-groups";
import { refetchAddonGroup } from "./helpers";
import { HttpTypes } from "../../../types/addons";

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminAddonGroupsListParams>,
  res: MedusaResponse<HttpTypes.AdminAddonGroupsListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  const query = remoteQueryObjectFromString({
    entryPoint: "addon_group",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  });

  const { rows: addon_groups, metadata } = await remoteQuery(query);

  res.json({
    addon_groups,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
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
