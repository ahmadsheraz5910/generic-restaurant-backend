import { updateProductsWorkflow } from "@medusajs/core-flows";
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { AdminUpdateAddonType } from "../validators";
import { deleteAddonsWorkflow } from "../../../../workflows/delete-addons";
import { refetchEntity } from "../../../../utils/refetch-entities";
import { AdminAddonDeleteResponse, AdminAddonResponse } from "../../../../types/addons/http-types";
import { updateAddonsWorkflow } from "../../../../workflows/update-addons";
import { remapAddonResponse, remapKeysForAddon } from "../helpers";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminAddonResponse>
) => {
  const selectFields = remapKeysForAddon(req.queryConfig.fields ?? []);
  const addon = await refetchEntity({
    entity: "addon",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: selectFields,
  });
  if (!addon) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Addon not found");
  }

  res.status(200).json({ addon:remapAddonResponse(addon) });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateAddonType>,
  res: MedusaResponse<AdminAddonResponse>
) => {
  const update = req.validatedBody;
  const existingAddon = await refetchEntity({
    entity: "addon",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: ["id"],
  });
  /**
   * Check if the addon exists with the id or not before calling the workflow.
   */
  if (!existingAddon) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Addon with id "${req.params.id}" not found`
    );
  }
  const { result } = await updateAddonsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update,
    },
  });
  const addon = await refetchEntity(
    {
      entity: "addon",
      idOrFilter: result[0].id,
      scope: req.scope,
      fields: remapKeysForAddon(req.queryConfig.fields ?? []),
    }
  );
  res.status(200).json({ addon: remapAddonResponse(addon) });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminAddonDeleteResponse>
) => {
  const id = req.params.id;

  await deleteAddonsWorkflow(req.scope).run({
    input: { ids: [id] },
  });

  res.status(200).json({
    id,
    object: "addon",
    deleted: true,
  });
};
