import {
  maybeApplyLinkFilter,
  MiddlewareRoute,
} from "@medusajs/framework/http";
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import * as QueryConfig from "./query-config";
import {
  AdminCreateAddonGroup,
  AdminGetAddonGroupParams,
  AdminGetAddonGroupsParams,
  AdminUpdateAddonGroup,
} from "./validators";
import { createLinkBody } from "@medusajs/medusa/api/utils/validators";
import ProductAddonGroupLink from "../../../links/addon-group_product";
export const adminAddonGroupsRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/addon-groups",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonGroupsParams,
        QueryConfig.listTransformQueryConfig
      ),
      maybeApplyLinkFilter({
        entryPoint: ProductAddonGroupLink.entryPoint,
        resourceId: "addon_group_id",
        filterableField: "product_id",
      }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/addon-groups/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAddonGroupParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addon-groups",
    middlewares: [
      validateAndTransformBody(AdminCreateAddonGroup),
      validateAndTransformQuery(
        AdminGetAddonGroupParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addon-groups/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateAddonGroup),
      validateAndTransformQuery(
        AdminGetAddonGroupsParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/addon-groups/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/addon-groups/:id/addons",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        AdminGetAddonGroupsParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/addon-groups/:id/products",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        AdminGetAddonGroupsParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
];
