import { queryKeysFactory } from "../../lib/query-key-factory";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { FetchError } from "@medusajs/js-sdk";
import { sdk } from "../../lib/sdk";
import { HttpTypes } from "../../../types/addons";
import { addonQueryKeys } from "./addons";

const ADDON_VARIANT_QUERY_KEY = "addon_variant" as const;
export const addonVariantsQueryKeys = queryKeysFactory(ADDON_VARIANT_QUERY_KEY);

export const useUpdateAddonVariant = (
  addonId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateAddonVariant) =>
      sdk.client.fetch<HttpTypes.AdminAddonVariantResponse>(
        `/admin/addons/${addonId}/variants/${variantId}`,
        {
          method: "POST",
          body: payload,
        }
      ),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: addonVariantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: addonVariantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: addonQueryKeys.detail(addonId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
