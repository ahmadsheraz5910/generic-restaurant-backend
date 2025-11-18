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
import { addonQueryKeys } from "./addons";

const ADDON_GROUPS_QUERY_KEY = "addon-groups" as const;
export const addonGroupsQueryKeys = queryKeysFactory(ADDON_GROUPS_QUERY_KEY);

export const useAddonGroups = (
  query?: HttpTypes.AdminAddonGroupsListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminAddonGroupsListResponse,
      FetchError,
      HttpTypes.AdminAddonGroupsListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: ({}) =>
      sdk.client.fetch("/admin/addon-groups", {
        query,
      }),
    queryKey: addonGroupsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useAddonGroup = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminAddonGroupResponse,
      FetchError,
      HttpTypes.AdminAddonGroupResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.client.fetch<HttpTypes.AdminAddonGroupResponse>(
        `/admin/addon-groups/${id}`,
        {
          query,
        }
      ),
    queryKey: addonGroupsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateAddonGroup = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminAddonGroupResponse,
    FetchError,
    HttpTypes.AdminUpdateAddonGroup
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<HttpTypes.AdminAddonGroupResponse>(
        `/admin/addon-groups/${id}`,
        {
          method: "POST",
          body: payload,
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonGroupsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: addonGroupsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateAddonGroupAddons = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminAddonGroupResponse,
    FetchError,
    HttpTypes.AdminUpdateAddonGroupAddons
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch(`/admin/addon-groups/${id}/addons`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonGroupsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: addonGroupsQueryKeys.detail(id),
      });
      /**
       * Invalidate addons list query to ensure that the addon-groups are updated.
       */
      queryClient.invalidateQueries({
        queryKey: addonQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateAddonGroup = (
  options?: UseMutationOptions<
    HttpTypes.AdminAddonGroupResponse,
    FetchError,
    HttpTypes.AdminCreateAddonGroup
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<HttpTypes.AdminAddonGroupResponse>(`/admin/addon-groups`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonGroupsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteAddonGroup = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminAddonGroupDeleteResponse,
    FetchError,
    void
  >
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<HttpTypes.AdminAddonGroupDeleteResponse>(
        `/admin/addon-groups/${id}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: addonGroupsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: addonGroupsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
