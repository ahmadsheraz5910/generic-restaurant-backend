import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/framework/http";
import * as QueryConfig from "./query-config";
import {
  AdminCreateAddon,
  AdminCreateAddonVariant,
  AdminGetAddonParams,
  AdminGetAddonsParams,
  AdminGetAddonVariantParams,
  AdminGetAddonVariantsParams,
  AdminUpdateAddon,
  AdminUpdateAddonVariant,
} from "./validators";

export const adminAddonRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/addons",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonsParams,
        QueryConfig.listAddonQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addons",
    middlewares: [
      validateAndTransformBody(AdminCreateAddon),
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/addons/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addons/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateAddon),
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/addons/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/addons/:id/variants",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonVariantsParams,
        QueryConfig.listAddonVariantConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addons/:id/variants",
    middlewares: [
      validateAndTransformBody(AdminCreateAddonVariant),
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/addons/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonVariantParams,
        QueryConfig.retrieveAddonVariantConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addons/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateAddonVariant),
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/addons/:id/variants/:variant_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonParams,
        QueryConfig.retrieveAddonQueryConfig
      ),
    ],
  },
];
