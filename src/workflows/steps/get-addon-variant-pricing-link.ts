import {
  arrayDifference,
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ADDON_MODULE } from "../../modules/addon";

export type GetAddonVariantPricingLinkStepInput = {
  ids: string[];
};

export const getAddonVariantPricingLinkStepId = "get-addonVariant-pricing-link";

export const getAddonVariantPricingLinkStep = createStep(
  getAddonVariantPricingLinkStepId,
  async (data: GetAddonVariantPricingLinkStepInput, { container }) => {
    if (!data.ids.length) {
      return new StepResponse([]);
    }

    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

    const linkService = remoteLink.getLinkModule(
      ADDON_MODULE,
      "addon_variant_id",
      Modules.PRICING,
      "price_set_id"
    )!;

    const existingItems = (await linkService.list(
      { addon_variant_id: data.ids },
      { select: ["addon_variant_id", "price_set_id"] }
    )) as {
      addon_variant_id: string;
      price_set_id: string;
    }[];

    if (existingItems.length !== data.ids.length) {
      const missing = arrayDifference(
        data.ids,
        existingItems.map((i) => i.addon_variant_id)
      );

      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Variants with IDs ${missing.join(", ")} do not have prices associated.`
      );
    }

    return new StepResponse(existingItems);
  }
);
