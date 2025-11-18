export const defaultAddonGroupFields = [
  "id",
  "title",
  "handle",
  "created_at",
  "updated_at",
  "metadata",
  "*addons",
  "*products"
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAddonGroupFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 10,
  isList: true,
}