import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export const refetchAddonGroup = async (
  addon_groupId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "addon_group",
    variables: {
      filters: { id: addon_groupId },
    },
    fields: fields,
  })

  const collections = await remoteQuery(queryObject)
  return collections[0]
}