import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/framework/http";
import { StoreAddCartAddonLineItem } from "./validators";
import { StoreGetCartsCart } from "@medusajs/medusa/api/store/carts/validators";
import * as QueryConfig from "@medusajs/medusa/api/store/carts/query-config";

export const storeCartExtendedRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/carts/:id/addon-line-items",
    middlewares: [
      validateAndTransformBody(StoreAddCartAddonLineItem),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
];
