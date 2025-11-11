import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { HttpTypes } from "../../../../../../types/addons";
import { refetchEntity } from "../../../../../../utils/refetch-entities";
import {
  remapAddonResponse,
  remapKeysForAddon,
  remapKeysForVariant,
  remapVariantResponse,
} from "../../../helpers";
import { updateAddonVariantsWorkflow } from "../../../../../../workflows/update-addon-variants";
import { deleteAddonVariantsWorkflow } from "../../../../../../workflows/delete-addon-variants";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminAddonVariantResponse>
) => {
  const addonId = req.params.id;
  const variantId = req.params.variant_id;
  const variables = { id: variantId, addon_id: addonId };

  const variant = await refetchEntity({
    entity: "addon_variant",
    idOrFilter: variables,
    scope: req.scope,
    fields: remapKeysForVariant(req.queryConfig.fields ?? []),
  });

  res.status(200).json({ addon_variant: remapVariantResponse(variant) });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUpdateAddonVariant>,
  res: MedusaResponse<HttpTypes.AdminAddonResponse>
) => {
  const addonId = req.params.id;
  const variantId = req.params.variant_id;

  await updateAddonVariantsWorkflow(req.scope).run({
    input: {
      selector: { id: variantId, addon_id: addonId },
      update: req.validatedBody,
    },
  });
  const addon = await refetchEntity({
    entity: "addon",
    idOrFilter: addonId,
    scope: req.scope,
    fields: remapKeysForAddon(req.queryConfig.fields ?? []),
  });

  res.status(200).json({ addon: remapAddonResponse(addon) });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminAddonVariantDeleteResponse>
) => {
  const addonId = req.params.id;
  const variantId = req.params.variant_id;

  await deleteAddonVariantsWorkflow(req.scope).run({
    input: { ids: [variantId] },
  });

  const addon = await refetchEntity({
    entity: "addon",
    idOrFilter: addonId,
    scope: req.scope,
    fields: remapKeysForAddon(req.queryConfig.fields ?? []),
  });

  res.status(200).json({
    id: variantId,
    object: "addon_variant",
    deleted: true,
    parent: remapAddonResponse(addon),
  });
};
