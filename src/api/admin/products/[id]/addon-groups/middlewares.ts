import { MiddlewareRoute } from "@medusajs/framework/http";
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { createLinkBody } from "@medusajs/medusa/api/utils/validators";
import { AdminGetProductParams } from "@medusajs/medusa/api/admin/products/validators";
import * as QueryConfig from "@medusajs/medusa/api/admin/products/query-config";


export const adminProductExtendedRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/products/:id/addon-groups",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        AdminGetProductParams,
        {
          ...QueryConfig.retrieveProductQueryConfig,
          defaults:[
            ...QueryConfig.retrieveProductQueryConfig.defaults,
            "addon_groups.id",
            "addon_groups.title"
          ]

        }
      ),
    ],
  },
];
