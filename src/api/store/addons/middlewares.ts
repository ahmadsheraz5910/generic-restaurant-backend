import { validateAndTransformQuery } from "@medusajs/framework";
import {
  applyDefaultFilters,
  clearFiltersByKey,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import * as QueryConfig from "./query-config";
import { StoreGetAddonsParams } from "./validators";
import {
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index";
import { ProductStatus } from "@medusajs/framework/utils";

export const storeAddonRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/addons",
    middlewares: [
      validateAndTransformQuery(
        StoreGetAddonsParams,
        QueryConfig.listAddonQueryConfig
      ),
      applyDefaultFilters({
        status: ProductStatus.PUBLISHED,
      }),
      normalizeDataForContext(),
      setPricingContext(),
      setTaxContext(),
      clearFiltersByKey(["region_id", "country_code", "province", "cart_id"]),
    ],
  },
];
