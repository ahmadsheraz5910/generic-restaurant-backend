import {
  arrayDifference,
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  CalculatedPriceSet,
  IPricingModuleService,
  Query,
} from "@medusajs/framework/types";
import { BaseAddonVariant } from "../../types/addons/types";

export type GetAddonVariantPricingStepInput = {
  addon_variant_ids: string[];
  context: Record<string, string | number>;
};

export type GetVariantPriceSetsStepOutput = ({
  calculated_price: CalculatedPriceSet;
} & BaseAddonVariant)[];

export const getAddonVariantPricingStepId = "get-addonVariant-pricing";

export const getAddonVariantPricingStep = createStep(
  getAddonVariantPricingStepId,
  async (
    input: GetAddonVariantPricingStepInput,
    { container }
  ): Promise<StepResponse<GetVariantPriceSetsStepOutput>> => {
    if (!input.addon_variant_ids.length) {
      return new StepResponse([]);
    }

    const pricingModuleService = container.resolve<IPricingModuleService>(
      Modules.PRICING
    );
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY);
    const { data: addonVariants } = await query.graph(
      {
        entity: "addon_variant",
        fields: ["id", "price_set.id"],
        filters: { id: input.addon_variant_ids },
      },
      {
        cache: {
          enable: true,
        },
      }
    );
    const notFound = addonVariants
      .filter((v) => !v.price_set?.id)
      .map((v) => v.id);

    if (notFound.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Addon Variants with IDs ${notFound.join(", ")} do not have a price`
      );
    }

    const priceSetIds = addonVariants
      .map((v) => v.price_set?.id)
      .filter((v) => !!v) as string[];

    const calculatedPriceSets = await pricingModuleService.calculatePrices(
      { id: priceSetIds },
      { context: input.context }
    );

    const notFoundCalculatedPriceSets: string[] = [];
    for (const addonVariant of addonVariants) {
      const calculatedPrice = calculatedPriceSets.find(
        (ps) => ps.id === addonVariant.price_set?.id
      );
      if (!calculatedPrice) {
        notFoundCalculatedPriceSets.push(addonVariant.id);
      }
      //@ts-ignore
      addonVariant.calculated_price = calculatedPrice;
    }

    if (notFoundCalculatedPriceSets.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Addons with IDs ${notFoundCalculatedPriceSets.join(
          ", "
        )} do not have a price`
      );
    }

    return new StepResponse(
      addonVariants as unknown as GetVariantPriceSetsStepOutput
    );
  }
);
