import { defineMiddlewares, MiddlewareRoute } from "@medusajs/framework/http";
import { adminAddonRoutesMiddlewares } from "./admin/addons/middlewares";
import { adminAddonGroupsRoutesMiddlewares } from "./admin/addon-groups/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminAddonRoutesMiddlewares,
    ...adminAddonGroupsRoutesMiddlewares,
  ],
});
