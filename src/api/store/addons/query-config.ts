/**
 * Addons
 */
export const defaultStoreAddonFields = [
  "id",
  "title",
  "status",
  "handle",
  "thumbnail",
  "created_at",
  "updated_at",
  "*variants",
]

export const retrieveAddonQueryConfig = {
  defaults: defaultStoreAddonFields,
  isList: false,
}

export const listAddonQueryConfig = {
  ...retrieveAddonQueryConfig,
  defaultLimit: 50,
  isList: true,
}



