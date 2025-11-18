import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  refetchEntities,
  refetchEntity,
} from "../../../../../utils/refetch-entities";
import {
  remapAddonResponse,
  remapKeysForAddon,
  remapKeysForVariant,
  remapVariantResponse,
} from "../../helpers";
import { wrapVariantsWithTotalInventoryQuantity } from "@medusajs/medusa/api/utils/middlewares/index";
import { HttpTypes } from "../../../../../types/addons";
import { createAddonVariantsWorkflow } from "../../../../../workflows/create-addon-variants";

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminAddonVariantParams>,
  res: MedusaResponse<HttpTypes.AdminAddonVariantListResponse>
) => {
  const addonId = req.params.id;

  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("inventory_quantity")
    );
  }

  const { data: variants, metadata } = await refetchEntities({
    entity: "addon_variant",
    idOrFilter: { ...req.filterableFields, addon_id: addonId },
    scope: req.scope,
    fields: remapKeysForVariant(req.queryConfig.fields ?? []),
    pagination: req.queryConfig.pagination,
  });

  if (withInventoryQuantity) {
    await wrapVariantsWithTotalInventoryQuantity(req, variants || []);
  }

  res.json({
    addon_variants: variants.map(remapVariantResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminCreateAddonVariant>,
  res: MedusaResponse<HttpTypes.AdminAddonResponse>
) => {
  const addonId = req.params.id;
  const input = [
    {
      ...req.validatedBody,
      addon_id: addonId,
    },
  ];

  await createAddonVariantsWorkflow(req.scope).run({
    input: { addon_variants: input },
  });

  const addon = await refetchEntity({
    entity: "addon",
    idOrFilter: addonId,
    scope: req.scope,
    fields: remapKeysForAddon(req.queryConfig.fields ?? []),
  });
  res.status(200).json({ addon: remapAddonResponse(addon) });
};
