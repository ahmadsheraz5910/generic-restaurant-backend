import { HttpTypes } from "../../../../types/addons";
import { useQueryParams } from "../../../hooks/use-query-params";

type UseAddonTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

const DEFAULT_FIELDS = "id,title,handle";

export const useAddonGroupTableQuery = ({
  prefix,
  pageSize = 20,
}: UseAddonTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "order", "q", "created_at", "updated_at", "id"],
    prefix
  );

  const { offset, created_at, updated_at, order, q } = queryObject;

  const searchParams: HttpTypes.AdminAddonListRequest = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order,
    q,
    fields: DEFAULT_FIELDS,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
