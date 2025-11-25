import { defineMiddlewares, MiddlewareRoute } from "@medusajs/framework/http";
import { adminAddonRoutesMiddlewares } from "./admin/addons/middlewares";
import { adminAddonGroupsRoutesMiddlewares } from "./admin/addon-groups/middlewares";
import { adminProductExtendedRoutesMiddlewares } from "./admin/products/[id]/addon-groups/middlewares";
import { storeAddonRoutesMiddlewares } from "./store/addons/middlewares";
import { storeProductWithAddonsRoutesMiddlewares } from "./store/products/[id]/with-addons/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminAddonRoutesMiddlewares,
    ...adminAddonGroupsRoutesMiddlewares,
    ...adminProductExtendedRoutesMiddlewares,
    ...storeAddonRoutesMiddlewares,
    ...storeProductWithAddonsRoutesMiddlewares
  ],
});
