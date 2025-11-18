import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { AdminUpdateAddonGroupType } from "../validators";
import { refetchAddonGroup } from "../helpers";

import { updateAddonGroupsWorkflow } from "../../../../workflows/update-addon-groups";
import { deleteAddonGroupsWorkflow } from "../../../../workflows/delete-addon-groups";
import { HttpTypes } from "../../../../types/addons";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminAddonGroupResponse>
) => {
  const addon_group = await refetchAddonGroup(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ addon_group });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateAddonGroupType>,
  res: MedusaResponse<HttpTypes.AdminAddonGroupResponse>
) => {
  const existingAddonGroup = await refetchAddonGroup(req.params.id, req.scope, [
    "id",
  ]);
  
  if (!existingAddonGroup) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Addon-Group with id "${req.params.id}" not found`
    );
  }

  await updateAddonGroupsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  });

  const addon_group = await refetchAddonGroup(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({ addon_group });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminAddonGroupDeleteResponse>
) => {
  const id = req.params.id;

  await deleteAddonGroupsWorkflow(req.scope).run({
    input: { ids: [id] },
  });
  res.status(200).json({
    id,
    object: "addon_group",
    deleted: true,
  });
};
