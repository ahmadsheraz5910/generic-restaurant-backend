import { validateAndTransformQuery } from "@medusajs/framework";
import {
  applyDefaultFilters,
  applyParamsAsFilters,
  authenticate,
  clearFiltersByKey,
  maybeApplyLinkFilter,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import { ProductStatus } from "@medusajs/framework/utils";
import * as QueryConfig from "./query-config";
import {
  filterByValidSalesChannels,
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index";
import { StoreGetProductWithAddonsParams } from "./validators";

export const storeProductWithAddonsRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/products/:id/with-addons",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnauthenticated: true,
      }),
      validateAndTransformQuery(
        StoreGetProductWithAddonsParams,
        QueryConfig.retrieveProductWithAddonsQueryConfig
      ),
      applyParamsAsFilters({ id: "id" }),
      filterByValidSalesChannels(),
      maybeApplyLinkFilter({
        entryPoint: "product_sales_channel",
        resourceId: "product_id",
        filterableField: "sales_channel_id",
      }),
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
