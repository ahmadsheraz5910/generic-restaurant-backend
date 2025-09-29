import { HttpTypes } from "@medusajs/framework/types"
import { useMutation, UseMutationOptions, useQueryClient } from "@tanstack/react-query"
import { FetchError } from "@medusajs/js-sdk"
import { sdk } from "../../lib/sdk"
import { queryKeysFactory } from "../../lib/query-key-factory"


const COLLECTION_QUERY_KEY = "collections" as const
export const collectionsQueryKeys = queryKeysFactory(COLLECTION_QUERY_KEY)


export const useUpdateCollection = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCollectionResponse,
    FetchError,
    HttpTypes.AdminUpdateCollection
  >
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => sdk.admin.productCollection.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: collectionsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: collectionsQueryKeys.detail(id),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}