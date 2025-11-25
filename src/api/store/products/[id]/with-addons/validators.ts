import { StoreGetProductsParamsFields } from "@medusajs/medusa/api/store/products/validators";
import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common";
import { StoreGetProductParamsDirectFields } from "@medusajs/medusa/api/utils/common-validators/index";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const StoreGetProductWithAddonsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreGetProductsParamsFields)
  .merge(applyAndAndOrOperators(StoreGetProductParamsDirectFields));
