/**
 * Addon Variants
 */
export const defaultAdminAddonsVariantFields = [
  "id",
  "addon_id",
  "title",
  "created_at",
  "updated_at",
  "deleted_at",
  "variant_rank",
  "*prices",
  "prices.price_rules.value",
  "prices.price_rules.attribute"
]

export const retrieveAddonVariantConfig = {
  defaults: defaultAdminAddonsVariantFields,
  isList: false,
}

export const listAddonVariantConfig = {
  ...retrieveAddonVariantConfig,
  defaultLimit: 50,
  isList: true,
}

/**
 * Addons
 */
export const defaultAdminAddonFields = [
  "id",
  "title",
  "status",
  "handle",
  "thumbnail",
  "addon_group_id",
  "created_at",
  "updated_at",
  "*addonGroup",
  "*variants",
  "*variants.prices",
  "variants.prices.price_rules.value",
  "variants.prices.price_rules.attribute",
]

export const retrieveAddonQueryConfig = {
  defaults: defaultAdminAddonFields,
  isList: false,
}

export const listAddonQueryConfig = {
  ...retrieveAddonQueryConfig,
  defaultLimit: 50,
  isList: true,
}



