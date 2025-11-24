import { MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  isPresent,
  Modules,
} from "@medusajs/framework/utils";
import {
  RequestWithContext,
  wrapProductsWithTaxPrices,
} from "@medusajs/medusa/api/store/products/helpers";
import { StoreGetAddonsParamsType } from "./validators";

export const GET = async (
  req: RequestWithContext<StoreGetAddonsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const pricingModule = req.scope.resolve(Modules.PRICING);
  req.queryConfig.fields = req.queryConfig.fields.map((f) =>
    f.startsWith("variants.calculated_price") ? "variants.price_set.id" : f
  );
  const { data: addons = [], metadata } = await query.graph({
    entity: "addon",
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination,
    filters: req.filterableFields,
  });
  if (!isPresent(req.pricingContext)) {
    return res.json({
      addons,
      count: metadata!.count,
      offset: metadata!.skip,
      limit: metadata!.take,
    });
  }

  const priceSetAndVariantMap = new Map<string, string>();
  for (const addon of addons) {
    for (const variant of addon.variants) {
      if (variant?.price_set?.id) {
        priceSetAndVariantMap.set(variant.id, variant.price_set.id);
      }
    }
  }
  const priceSets = await pricingModule.listPriceSets(
    {
      id: Array.from(priceSetAndVariantMap.values()),
      //@ts-ignore
      context: req.pricingContext!,
    },
    {
      relations: ["calculated_price"],
    }
  );

  for (const addon of addons) {
    for (const variant of addon.variants) {
      if (variant?.price_set?.id) {
        const priceSetId = priceSetAndVariantMap.get(variant.id);
        //@ts-ignore
        variant.calculated_price = priceSets.find(
          (ps) => ps.id === priceSetId
        )?.calculated_price;
        //@ts-ignore
        delete variant.price_set;
      }
    }
  }

  //@ts-ignore
  await wrapProductsWithTaxPrices(req, addons);

  res.json({
    addons,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
