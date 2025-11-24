//@ts-nocheck
import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { createAddonsWorkflow } from "../../../workflows/create-addons";
import { AdminCreateAddonType } from "./validators";
import {
  AdminAddonListParams,
  AdminAddonListResponse,
  AdminAddonResponse,
} from "../../../types/addons/http-types";
import { refetchEntities, refetchEntity } from "../../../utils/refetch-entities";
import { remapAddonResponse, remapKeysForAddon } from "./helpers";




export const GET = async (
  req: AuthenticatedMedusaRequest<AdminAddonListParams>,
  res: MedusaResponse<AdminAddonListResponse>
) => {
  const selectFields = remapKeysForAddon(req.queryConfig.fields ?? []);
  const { data: addons, metadata } = await refetchEntities(
    {
      entity: "addon",
      scope: req.scope,
      fields: selectFields,
      idOrFilter: req.filterableFields,
      pagination: req.queryConfig.pagination,
      withDeleted: req.queryConfig.withDeleted
    }
  );

  res.json({
    addons: addons.map(remapAddonResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAddonType>,
  res: MedusaResponse<AdminAddonResponse>
) => {
  const { result } = await createAddonsWorkflow(req.scope).run({
    input: { addons: [req.validatedBody] },
  });
  const fields = remapKeysForAddon(req.queryConfig.fields ?? []);
  
  const addon = await refetchEntity({
    entity: "addon",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: fields,

  });
  res.status(200).json({ addon: remapAddonResponse(addon) });
};
