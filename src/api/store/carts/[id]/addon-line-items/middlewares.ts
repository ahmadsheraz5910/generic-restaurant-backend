import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/framework/http";
import { StoreAddCartAddonLineItem ,StoreUpdateCartAddonLineItem} from "./validators";
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
  {
    method: ["POST"],
    matcher: "/store/carts/:id/addon-line-items/:line_id",
    middlewares: [
      validateAndTransformBody(StoreUpdateCartAddonLineItem),
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/carts/:id/addon-line-items/:line_id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCartsCart,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  }
];
