import { QueryKey, UseQueryOptions } from "@tanstack/react-query";

export type TQueryKey<TKey, TListQuery = unknown, TDetailQuery = string> = {
  all: readonly [TKey];
  lists: () => readonly [...TQueryKey<TKey>["all"], "list"];
  list: (
    query?: TListQuery
  ) =>
    | readonly [...ReturnType<TQueryKey<TKey>["lists"]>, { query: TListQuery }]
    | readonly [...ReturnType<TQueryKey<TKey>["lists"]>];

  details: () => readonly [...TQueryKey<TKey>["all"], "detail"];
  detail: (
    id: TDetailQuery,
    query?: TListQuery
  ) =>
    | readonly [
        ...ReturnType<TQueryKey<TKey>["details"]>,
        TDetailQuery,
        { query: TListQuery }
      ]
    | readonly [...ReturnType<TQueryKey<TKey>["details"]>, TDetailQuery];
};

export type UseQueryOptionsWrapper<
  // Return type of queryFn
  TQueryFn = unknown,
  // Type thrown in case the queryFn rejects
  E = Error,
  // Query key type
  TQueryKey extends QueryKey = QueryKey
> = Omit<
  UseQueryOptions<TQueryFn, E, TQueryFn, TQueryKey>,
  "queryKey" | "queryFn"
>;

export const queryKeysFactory = <
  T,
  TListQueryType = unknown,
  TDetailQueryType = string
>(
  globalKey: T
) => {
  const queryKeyFactory: TQueryKey<T, TListQueryType, TDetailQueryType> = {
    all: [globalKey],
    lists: () => [...queryKeyFactory.all, "list"],
    list: (query?: TListQueryType) =>
      query
        ? [...queryKeyFactory.lists(), { query }]
        : [...queryKeyFactory.lists()],
    details: () => [...queryKeyFactory.all, "detail"],
    detail: (id: TDetailQueryType, query?: TListQueryType) =>
      query
        ? [...queryKeyFactory.details(), id, { query }]
        : [...queryKeyFactory.details(), id],
  };
  return queryKeyFactory;
};
