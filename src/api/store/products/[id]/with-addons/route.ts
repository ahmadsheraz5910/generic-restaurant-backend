import { MedusaResponse } from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  isPresent,
  MedusaError,
  Modules,
  QueryContext,
} from "@medusajs/framework/utils";
import {
  refetchProduct,
  RequestWithContext,
  wrapProductsWithTaxPrices,
} from "@medusajs/medusa/api/store/products/helpers";
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "@medusajs/medusa/api/utils/middlewares/index";

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreProductParams>,
  res: MedusaResponse<HttpTypes.StoreProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const pricingModule = req.scope.resolve(Modules.PRICING);
  
  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("variants.inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("variants.inventory_quantity")
    );
  }

  const filters: object = {
    id: req.params.id,
    ...req.filterableFields,
  };

  if (isPresent(req.pricingContext)) {
    filters["context"] ??= {};
    filters["context"]["variants"] ??= {};
    filters["context"]["variants"]["calculated_price"] ??= QueryContext(
      req.pricingContext!
    );

  }

  const product = await refetchProduct(
    filters,
    req.scope,
    req.queryConfig.fields
  );

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${req.params.id} was not found`
    );
  }

  if (withInventoryQuantity) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      product.variants || []
    );
  }
  await wrapProductsWithTaxPrices(req, [product]);

  if (!isPresent(req.pricingContext)) {
    return res.json({ product });
  }

  // Fetching addons and their calculated prices
  const addons = product.addon_groups.map(ad => ad.addons).flat()
  
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

  res.json({ product });
};
