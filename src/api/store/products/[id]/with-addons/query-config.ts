export const defaultStoreProductWithAddonsFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "created_at",
  "updated_at",
  "*collection",
  "*options",
  "*options.values",
  "*images",
  "*variants",
  "*variants.options",
  "*variants.calculated_price",
  "*addon_groups",
  "*addon_groups.addons",
  "*addon_groups.addons.variants",
  "*addon_groups.addons.variants.price_set.id",
]

export const retrieveProductWithAddonsQueryConfig = {
  defaults: defaultStoreProductWithAddonsFields,
  isList: false,
}

export const listProductWithAddonsQueryConfig = {
  ...retrieveProductWithAddonsQueryConfig,
  defaultLimit: 50,
  isList: true,
}
