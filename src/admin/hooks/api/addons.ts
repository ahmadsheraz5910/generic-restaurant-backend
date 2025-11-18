import { FetchError } from "@medusajs/js-sdk";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { sdk } from "../../lib/sdk";
import { HttpTypes } from "../../../types/addons";

const ADDONS_QUERY_KEY = "addons" as const;
export const addonQueryKeys = queryKeysFactory(ADDONS_QUERY_KEY);

export const useAddons = (
  query?: HttpTypes.AdminAddonListRequest,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminAddonListResponse,
      FetchError,
      HttpTypes.AdminAddonListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: ({}) =>
      sdk.client.fetch("/admin/addons", {
        query,
      }),
    queryKey: addonQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAddon = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminAddonResponse,
      FetchError,
      HttpTypes.AdminAddonResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.client.fetch<HttpTypes.AdminAddonResponse>(`/admin/addons/${id}`, {
        query,
      }),
    queryKey: addonQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateAddon = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminAddonResponse,
    FetchError,
    HttpTypes.AdminUpdateAddon
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<HttpTypes.AdminAddonResponse>(`/admin/addons/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: addonQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateAddon = (
  options?: UseMutationOptions<
    HttpTypes.AdminAddonResponse,
    FetchError,
    HttpTypes.AdminCreateAddon
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<HttpTypes.AdminAddonResponse>(`/admin/addons`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteAddon = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminAddonDeleteResponse,
    FetchError,
    void
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<HttpTypes.AdminAddonDeleteResponse>(
        `/admin/addons/${id}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: addonQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
